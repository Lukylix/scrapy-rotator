import axios from "axios";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const maxRetries = 10; // Maximum number of connection attempts
const maxRequestFailedPerProxy = 10;
const delayBetweenRetry = 1000;
let useProxies = true;
// Round-robin load balancing between instances
let currentInstanceIndex = 0;
let proxies = [];
let instances;

export async function intialise(proxiesArg) {
	proxies = proxiesArg;
	instances = await getInstances();
	console.log("Proxies disponibles:", proxies.length);
}

async function createAxiosInstance(proxy) {
	const headers = {
		"User-Agent": "Mozilla/5 (X11; U; Linux i686; en-US) Gecko/2010 Ubuntu/9.10 (karmic) Firefox/3.5",
		"X-SSL-PROTOCOL": "TLSv1.2",
	};

	const httpsAgent = new https.Agent({
		// ciphers: "aes256-gcm-sha384",
		// secureProtocol: "TLSv1_2_method",
		rejectUnauthorized: false,
		checkServerIdentity: () => undefined,
		// save the last certificate for future use
		cache: {
			maxAge: 0, // force cache to never expire
		},
	});

	const axiosConfig = {
		headers,
		httpsAgent,
	};

	if (proxy) {
		axiosConfig.proxy = {
			protocol: "http",
			host: proxy.ip,
			port: proxy.port,
			timeout: 10000,
		};
	}

	const instance = axios.create(axiosConfig);

	// Add a response interceptor to retry failed requests
	instance.interceptors.response.use(
		(response) => response,
		async (error) => {
			const originalRequest = { ...error.config, retryCount: error.config?.retryCount || 0 };
			if (
				(error?.response?.status >= 400 && error?.response?.status < 500) ||
				error?.response?.status === 502 ||
				error?.response?.status === 503 ||
				error?.code === "ECONNABORTED" ||
				error?.code === "ECONNREFUSED" ||
				error?.code === "ECONNRESET"
			) {
				// Increment the count of failed requests for the current proxy
				if (proxy) proxy.failedRequests++;

				if (error?.response?.status === 503) console.log(error.response.data);

				// Remove the proxy if it has tooMany failed requests
				if (proxy && proxy.failedRequests > maxRequestFailedPerProxy) {
					console.log(`Proxy ${proxy.ip}:${proxy.port} removed due to too many failed requests`);
					return null;
				}

				originalRequest.retryCount++;
				if (originalRequest.retryCount >= maxRetries) {
					return Promise.reject(new Error("Maximum retries reached"));
				}

				const nextInstance = getNextInstance();
				if (nextInstance === null) return Promise.reject(new Error("No more proxies available"));

				// Delay before retrying the request
				await new Promise((resolve) => setTimeout(resolve, delayBetweenRetry));
				console.log(
					`Retrying: ${originalRequest.url} n°${originalRequest.retryCount}, ${error?.code || ""} ${
						error?.response?.status || ""
					}`
				);
				return nextInstance(originalRequest);
			}
			return Promise.reject(error);
		}
	);

	return instance;
}

// Create an array of axios instances per proxy
async function getInstances() {
	if (useProxies === false) {
		const instance = await createAxiosInstance();
		return [instance];
	}

	const availableProxies = proxies.filter((proxy) => proxy.failedRequests || 0 <= maxRequestFailedPerProxy);
	const instances = await Promise.all(availableProxies.map(createAxiosInstance));
	return instances;
}

export async function getCompatibleProxies(url) {
	// Reset the count of failed requests for each proxy
	proxies.forEach((proxy) => (proxy.failedRequests = 0));
	proxies = await Promise.all(
		proxies.filter(async (proxy, index) => {
			try {
				const res = await axios.get(url, {
					timeout: 5000,
					proxy: {
						protocol: "http",
						host: proxy.ip,
						port: proxy.port,
					},
				});
				if (res.status == 200) return true;
				return false;
			} catch (err) {
				return false;
			}
		})
	);
	console.log("Proxies valides :", proxies.length);
	instances = await getInstances();
	return proxies;
}

//The next axios instance to use
export function getNextInstance() {
	if (instances.length === 0) return null;
	const instance = instances[currentInstanceIndex];
	currentInstanceIndex = (currentInstanceIndex + 1) % instances.length;
	return instance;
}

export async function useLocalIp() {
	useProxies = false;
	instances = await getInstances();
}
