import cheerio from "cheerio";
import { getNextInstance, getCompatibleProxies, intialize } from "../../clients/axios.js";
import { getFilePath } from "../../utils/getFilePath.js";
import fs from "fs";
import dotenv from "dotenv";
import { writeFileSync } from "../../utils/writeFileSync.js";
import { parseCPUsList, parseCPUInfos } from "../../parsers/cpuBenchmark.js";

dotenv.config();

await getCompatibleProxies(process.env.BENCHMARK_SITE);

export default async function main(proxies) {
	try {
		await intialize(proxies);
		const instance = await getNextInstance();
		let cpus = [];
		const requestUrl = `${process.env.BENCHMARK_SITE}/socketType.html#i32`;
		const res = await instance.get(requestUrl);
		const $ = cheerio.load(res.data);

		cpus = await parseCPUsList($);
		cpus.sort((a, b) => b.sThread - a.sThread);
		const cpuPromises = cpus.map(async (cpu, index) => {
			try {
				const instance = await getNextInstance();
				if (instance === null) throw new Error("No more instances available");
				const res = await instance.get(cpu.link);
				const $ = cheerio.load(res.data);
				return await parseCPUInfos({ $, cpu });
			} catch (error) {}
		});
		cpus = await Promise.all(cpuPromises);

		writeFileSync(getFilePath("../../data/cpus.json", import.meta.url), JSON.stringify(cpus));
		console.log("Nombre de processeurs scanné :", cpus.length);
	} catch (error) {}
}
