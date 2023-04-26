import { CheerioCrawler } from "crawlee";
import { getProxyConfiguration, setProxies } from "../../clients/crawlee.js";
import { getFilePath, writeFileSync } from "../../utils/index.js";
import dotenv from "dotenv";
import { parseCPUInfos, parseCPUsList } from "../../parsers/index.js";

dotenv.config();

let cpus = [];
let cpusInfos = [];
async function scrapeList({ $, request, enqueueLinks }) {
	cpus = await parseCPUsList($);
	await enqueueLinks({
		selector: ".chartlist li > a",
	});
}

async function scrapeCpuInfos({ $, request }) {
	const cpu = cpus.find((cpu) => request.loadedUrl.includes(cpu.link));
	cpusInfos = await parseCPUInfos({ $, cpu });
}

const routes = {
	list: `${process.env.BENCHMARK_SITE}/socketType`,
	cpuInfos: `${process.env.BENCHMARK_SITE}/cpu`,
};

export default async function main(proxies) {
	setProxies(proxies);
	const crawler = new CheerioCrawler({
		maxRequestRetries: 50,
		proxyConfiguration: getProxyConfiguration(),
		requestHandler: async ({ request, $, enqueueLinks, proxyInfo }) => {
			console.log(`Fetched: ${request.url} ${proxyInfo.hostname}:${proxyInfo.port}`);
			const url = request.url;
			if (url.includes(routes.list)) return await scrapeList({ request, $, enqueueLinks });
			if (url.includes(routes.cpuInfos)) return await scrapeCpuInfos({ request, $ });
		},
	});
	await crawler.run([`${process.env.BENCHMARK_SITE}/socketType.html#i32`]);
	writeFileSync(getFilePath("../../../common/data/cpus.json", import.meta.url), JSON.stringify(cpusInfos));
	console.log("Nombre de processeurs scanné :", cpusInfos.length);
}
