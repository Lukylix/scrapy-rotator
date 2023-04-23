import cheerio from "cheerio";
import { getNextInstance, getCompatibleProxies, useLocalIp, intialize } from "../../clients/axios.js";
import { getFilePath } from "../../utils/getFilePath.js";
import dotenv from "dotenv";
import fs from "fs";
import { writeFileSync } from "../../utils/writeFileSync.js";
import { parseCPUsPage } from "../../parsers/cpuPrices.js";
import { matchAndAssignCPUPrices } from "../comon/matchAndAssignCPUPrices.js";
import { readFileSync } from "../../utils/readFileSync.js";

dotenv.config();

const skipFetching = false;

let cpus = JSON.parse(readFileSync(getFilePath("../../data/cpus.json", import.meta.url)));
console.log("CPUs already stored :", cpus.length);

await getCompatibleProxies(process.env.PRICE_SITE);

export default async function main(proxies) {
	try {
		await intialize(proxies);
		// await useLocalIp();
		let currentPage = 0;
		let totalCpusFounds = [];
		if (skipFetching) totalCpusFounds = JSON.parse(readFileSync(etFilePath("../data/cpusPrices.json")));
		if (!skipFetching)
			while (currentPage >= 0) {
				try {
					const instance = await getNextInstance();
					const requestUrl = `${process.env.PRICE_SITE}/cpu?&pageSizeProducts=48&page=${encodeURIComponent(
						currentPage
					)}`;
					const res = await instance.get(requestUrl);
					console.log(`Fecthed: ${requestUrl}`, currentPage);
					const $ = cheerio.load(res.data);
					const [cpusFounds, nextPage] = await parseCPUsPage($);
					totalCpusFounds = [...totalCpusFounds, ...cpusFounds];
					currentPage = nextPage;
				} catch (error) {
					currentPage = -1;
				}
			}
		cpus = matchAndAssignCPUPrices({ cpus, totalCpusFounds });

		if (!skipFetching)
			writeFileSync(getFilePath("../../data/cpusPrices.json", import.meta.url), JSON.stringify(totalCpusFounds));
		writeFileSync(getFilePath("../../data/cpusWithPrice.json", import.meta.url), JSON.stringify(cpus));
		console.log("CPUs founds:", totalCpusFounds.length);
	} catch (error) {}
}
