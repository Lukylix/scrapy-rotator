import { CheerioCrawler } from "crawlee";
import { getProxyConfiguration, setProxies } from "../../clients/crawlee.js";
import { getFilePath } from "../../utils/getFilePath.js";
import fs from "fs";
import dotenv from "dotenv";
import { writeFileSync } from "../../utils/writeFileSync.js";
import { parseCPUsPage } from "../../parsers/cpuPrices.js";
import { matchAndAssignCPUPrices } from "../comon/matchAndAssignCPUPrices.js";
import { readFileSync } from "../../utils/readFileSync.js";

dotenv.config();

const maxPagesWithoutProduct = 5;
const skipFetching = false;

export default async function main(proxies) {
	let cpus = JSON.parse(readFileSync(getFilePath("../../data/cpus.json", import.meta.url)));

	console.log("CPUs :", cpus.length);

	let nextPage = 0;
	let totalCpusFounds = [];
	let pagesWithoutProduct = 0;
	setProxies(proxies);
	const crawler = new CheerioCrawler({
		proxyConfiguration: getProxyConfiguration(),
		maxRequestRetries: 50,
		requestHandler: async ({ request, $, enqueueLinks, proxyInfo }) => {
			console.log(`Fetched: ${request.url} ${proxyInfo.hostname}:${proxyInfo.port}`);
			const [cpusFounds, nextPage] = parseCPUsPage($);
			totalCpusFounds = [...totalCpusFounds, cpusFounds];
			if (nextPage > 0)
				await crawler.addRequests([`${process.env.PRICE_SITE}/cpu?&pageSizeProducts=48&page=${nextPage}`]);
		},
	});

	if (skipFetching)
		totalCpusFounds = JSON.parse(readFileSync(getFilePath("../../data/cpusPrices.json", import.meta.url)));
	else {
		await crawler.run([`${process.env.PRICE_SITE}/cpu?&pageSizeProducts=48&page=0`]);
	}

	cpus = matchAndAssignCPUPrices({ cpus, totalCpusFounds });

	if (!skipFetching)
		writeFileSync(getFilePath("../../data/cpusPrices.json", import.meta.url), JSON.stringify(totalCpusFounds));
	writeFileSync(getFilePath("../../data/cpusWithPrice.json", import.meta.url), JSON.stringify(cpus));
}
