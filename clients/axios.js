import axios from "axios";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const maxRetries = 10; // Maximum number of connection attempts
const delayBetweenRetry = 1000;
let useProxies = true;
let proxies = [];
let instances;

// Map of proxies with their success rate and load metrics
const proxyMap = new Map();

// Configuration options for load balancing
const config = {
	minRequestsBeforeExclusion: 5,
	minSuccessRate: 0.1,
	maxSuccessRate: 1,
	successRateStep: 0.1,
	maxConcurrentRequests: 2,
};

export async function intialize(proxiesArg) {
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
		timeout: 10000,
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

	// Track the number of active requests for each proxy
	instance.interceptors.request.use((config) => {
		const {
			proxy: { host, port },
		} = config;
		if (proxyMap.has(`${host}:${port}`)) {
			const metrics = proxyMap.get(`${host}:${port}`);
			metrics.activeRequests++;
		}
		return config;
	});

	instance.interceptors.response.use(
		(response) => {
			const { host, port } = response.config.proxy;
			console.log(`Fetched : ${response.config.url}`);
			if (proxyMap.has(`${host}:${port}`)) {
				const metrics = proxyMap.get(`${host}:${port}`);
				metrics.activeRequests--;
				metrics.successfulRequests++;
				metrics.successRate = metrics.successfulRequests / (metrics.successfulRequests + metrics.failedRequests);
			}
			return response;
		},
		async (error) => {
			const { host, port } = error.response.config.proxy;
			if (proxyMap.has(`${host}:${port}`)) {
				const metrics = proxyMap.get(`${host}:${port}`);
				metrics.activeRequests--;
				metrics.failedRequests++;
				metrics.successRate = metrics.successfulRequests / (metrics.successfulRequests + metrics.failedRequests);
			}
			const originalRequest = { ...error.config, retryCount: error.config?.retryCount || 0 };
			if (
				(error?.response?.status >= 400 && error?.response?.status < 500) ||
				error?.response?.status === 502 ||
				error?.response?.status === 503 ||
				error?.code === "ECONNABORTED" ||
				error?.code === "ECONNREFUSED" ||
				error?.code === "ECONNRESET"
			) {
				originalRequest.retryCount++;
				if (originalRequest.retryCount >= maxRetries) {
					return Promise.reject(new Error("Maximum retries reached"));
				}

				const nextInstance = await getNextInstance();
				if (nextInstance == null) return Promise.reject(new Error("No more proxies available"));

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
	proxies.forEach((proxy) => addProxy(`${proxy.ip}:${proxy.port}`));
	const instances = await Promise.all(proxies.map(createAxiosInstance));
	return instances;
}

export async function getCompatibleProxies(url) {
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
	instances = await getInstances();
	return proxies;
}

// Create a new proxy and add it to the map
function addProxy(proxy) {
	proxyMap.set(proxy, {
		successfulRequests: 0,
		failedRequests: 0,
		successRate: 1,
		activeRequests: 0,
	});
}

// Get the next axios instance to use
export async function getNextInstance() {
	// Filter proxies based on success rate and current load
	const availableProxies = Array.from(proxyMap).filter(([proxy, metrics]) => {
		return (
			(metrics.activeRequests < config.maxConcurrentRequests &&
				metrics.failedRequests + metrics.successfulRequests <= config.minRequestsBeforeExclusion) ||
			(metrics.successRate >= config.minSuccessRate && metrics.successRate <= config.maxSuccessRate)
		);
	});
	// Select a proxy using weighted random selection
	if (availableProxies.length > 0) {
		const totalSuccessRate = availableProxies.reduce((sum, [proxy, metrics]) => {
			return sum + metrics.successRate;
		}, 0);
		const randomWeight = Math.random() * totalSuccessRate;
		let cumulativeWeight = 0;
		for (const [proxy, metrics] of availableProxies) {
			const [ip, port] = proxy.split(":");
			cumulativeWeight += metrics.successRate;
			if (cumulativeWeight >= randomWeight) {
				return await createAxiosInstance({ ip, port });
			}
		}
	}

	// If no available proxies, return null
	return null;
}

export async function useLocalIp() {
	useProxies = false;
	instances = await getInstances();
}
