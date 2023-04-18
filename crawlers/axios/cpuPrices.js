import cheerio from "cheerio";
import { getNextInstance, getCompatibleProxies, useLocalIp, intialise } from "../../clients/proxiesClient.js";
import { getFilePath } from "../../utils/getFilepath.js";
import dotenv from "dotenv";
import fs from "fs";
import { writeFileSync } from "../../utils/writeFileSync.js";

dotenv.config();

const skipFetching = false;

let cpus = JSON.parse(fs.readFileSync(getFilePath("../../data/cpus.json", import.meta.url)));
console.log("CPUs ", cpus.length);

export default async function main(proxies) {
	try {
		await intialise(proxies);
		// await useLocalIp();
		await getCompatibleProxies(process.env.PRICE_SITE);
		let nextPage = 0;
		let cpusFounds = [];
		if (skipFetching) cpusFounds = JSON.parse(fs.readFileSync(etFilePath("../data/cpusPrices.json")));
		if (!skipFetching)
			while (nextPage >= 0) {
				try {
					const instance = await getNextInstance();
					let cpusFoundsBeforeLength = cpusFounds.length;
					const res = await instance.get(
						`${process.env.PRICE_SITE}/cpu?&pageSizeProducts=48&page=${encodeURIComponent(nextPage)}`
					);
					console.log(
						`Fecthed: ${process.env.PRICE_SITE}/cpu?&pageSizeProducts=48&page=${encodeURIComponent(nextPage)}`,
						nextPage
					);
					const $ = cheerio.load(res.data);
					$(".itemIn").each((i, el) => {
						const productName = $(el).find("h3").text().trim();
						const procductLink = $(el).find("h3 a").attr("href");
						const price = $(el).find(".itemPrice .cenaDph strong").text();
						if ((productName, price)) cpusFounds.push({ productName, procductLink, price });
					});

					nextPage = parseInt($(".navig > #buttonNextPage").attr("href")?.match(/(\d+)/)[1]);
					if (cpusFoundsBeforeLength === cpusFounds.length) nextPage = -1;
				} catch (error) {
					console.log(error);
					nextPage = -1;
				}
			}
		cpus.forEach((cpu, i) => {
			const name = cpu.name.replace(/AMD/g, "").trim();
			const price = parseFloat(
				cpusFounds
					.find((cpu) => {
						const nameArray = name.toLowerCase().split(" ");
						return nameArray.every((word) => cpu.productName.toLowerCase().includes(word));
					})
					?.price.replace(/[€\s]/g, "")
			);

			if (price) cpus[i] = { ...cpu, price };
		});
		if (!skipFetching)
			writeFileSync(getFilePath("../../data/cpusPrices.json", import.meta.url), JSON.stringify(cpusFounds));
		writeFileSync(getFilePath("../../data/cpusWithPrice.json", import.meta.url), JSON.stringify(cpus));
		console.log("CPUs founds:", cpusFounds.length);
	} catch (error) {
		console.log(error);
	}
}
