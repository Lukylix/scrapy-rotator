import cheerio from "cheerio";
import { getNextInstance, getCompatibleProxies, useLocalIp, intialize } from "../../clients/axios.js";
import { getFilePath, readFileSync, writeFileSync } from "../../utils/index.js";
import dotenv from "dotenv";
import { parseCPUsPage } from "../../parsers/index.js";
import { matchAndAssignCPUPrices } from "../common/matchAndAssignCPUPrices.js";

dotenv.config();

const skipFetching = false;

let cpus = JSON.parse(readFileSync(getFilePath("../../data/cpus.json", import.meta.url)));

await getCompatibleProxies(process.env.PRICE_SITE);

export default async function main(proxies) {
	try {
		console.log("CPUs already stored :", cpus.length);
		await intialize(proxies);
		// await useLocalIp();
		let currentPage = 0;
		let totalCpusFounds = [];
		if (skipFetching) totalCpusFounds = JSON.parse(readFileSync(etFilePath("../../common/data/cpusPrices.json")));
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
			writeFileSync(
				getFilePath("../../../common/data/cpusPrices.json", import.meta.url),
				JSON.stringify(totalCpusFounds)
			);
		writeFileSync(getFilePath("../../../common/data/cpusWithPrice.json", import.meta.url), JSON.stringify(cpus));
		console.log("CPUs founds:", totalCpusFounds.length);
	} catch (error) {}
}
