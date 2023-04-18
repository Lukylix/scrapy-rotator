import { CheerioCrawler } from "crawlee";
import { getProxyConfiguration, setProxies } from "../../clients/proxiesClientCrawlee.js";
import { getFilePath } from "../../utils/getFilepath.js";
import fs from "fs";
import dotenv from "dotenv";
import { writeFileSync } from "../../utils/writeFileSync.js";

dotenv.config();

const maxPagesWithoutProduct = 5;
const skipFetching = false;

export default async function main(proxies) {
	let cpus = JSON.parse(fs.readFileSync(getFilePath("../../data/cpus.json", import.meta.url)));

	console.log("CPUs :", cpus.length);

	let nextPage = 0;
	let cpusFounds = [];
	let pagesWithoutProduct = 0;
	setProxies(proxies);
	const crawler = new CheerioCrawler({
		proxyConfiguration: getProxyConfiguration(),
		maxRequestRetries: 50,
		requestHandler: async ({ request, $, enqueueLinks, proxyInfo }) => {
			console.log(`Fetched: ${request.url} ${proxyInfo.hostname}:${proxyInfo.port}`);
			const cpusFoundBeforeLength = cpusFounds.length;
			$(".itemIn").each((i, el) => {
				const productName = $(el).find("h3").text().trim();
				const procductLink = $(el).find("h3 a").attr("href");
				const price = $(el).find(".itemPrice .cenaDph strong").text();
				if ((productName, price)) cpusFounds.push({ productName, procductLink, price });
			});
			nextPage = parseInt($(".navig > #buttonNextPage").attr("href")?.match(/(\d+)/)[1]);
			if (isNaN(nextPage) || !nextPage) nextPage = -1;
			if (cpusFoundBeforeLength === cpusFounds.length) pagesWithoutProduct++;
			if (pagesWithoutProduct >= maxPagesWithoutProduct) nextPage = -1;
			if (nextPage > 0)
				await crawler.addRequests([`${process.env.PRICE_SITE}/cpu?&pageSizeProducts=48&page=${nextPage}`]);
		},
	});

	if (skipFetching)
		cpusFounds = JSON.parse(fs.readFileSync(getFilePath("../../data/cpusPrices.json", import.meta.url)));
	else {
		await crawler.run([`${process.env.PRICE_SITE}/cpu?&pageSizeProducts=48&page=0`]);
	}

	cpus.forEach((cpu, i) => {
		const name = cpu.name.replace(/AMD/g, "").trim();
		let price = cpusFounds
			.find((cpu) => {
				const nameArray = name.toLowerCase().split(" ");
				return nameArray.every((word) => cpu.productName.toLowerCase().includes(word));
			})
			?.price.replace(/[€\s]/g, "");
		const pricefloat = parseFloat(price);
		if (!isNaN(pricefloat)) price = pricefloat;
		if (price) cpus[i] = { ...cpu, price };
	});

	if (!skipFetching)
		writeFileSync(getFilePath("../../data/cpusPrices.json", import.meta.url), JSON.stringify(cpusFounds));
	writeFileSync(getFilePath("../../data/cpusWithPrice.json", import.meta.url), JSON.stringify(cpus));
}
