import { ProxyConfiguration } from "crawlee";
import dotenv from "dotenv";

dotenv.config();

let proxies = [];

export function setProxies(proxiesArg) {
	proxies = proxiesArg.map((proxy) => ({ ...proxy, failedRequests: 0, successRequests: 0 })); // Initialize failedRequests and successRequests for each proxy
	console.log("Proxies disponibles:", proxies.length);
}

function getProxiesUrls(proxies) {
	return proxies.map((proxy) => `http://${proxy.ip}:${proxy.port}`);
}

export function getProxyConfiguration() {
	return new ProxyConfiguration({
		proxyUrls: getProxiesUrls(proxies),
	});
}
