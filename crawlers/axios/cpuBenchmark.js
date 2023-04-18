import cheerio from "cheerio";
import { getNextInstance, getCompatibleProxies, intialise } from "../../clients/proxiesClient.js";
import { getFilePath } from "../../utils/getFilepath.js";
import fs from "fs";
import dotenv from "dotenv";
import { writeFileSync } from "../../utils/writeFileSync.js";

dotenv.config();

await getCompatibleProxies(process.env.BENCHMARK_SITE);
export default async function main(proxies) {
	try {
		await intialise(proxies);
		const instance = await getNextInstance();
		console.log("Instance :", instance);
		let cpus = [];
		const res = await instance.get(`${process.env.BENCHMARK_SITE}/socketType.html#i32`);
		const $ = cheerio.load(res.data);
		console.log(`Fecthed: ${process.env.BENCHMARK_SITE}/socketType.html#i32`);

		$(".chartlist li").each((i, el) => {
			const name = $(el).find(".prdname").text().trim();
			const sThread = parseInt($(el).find(".count").text().trim().replace(/,/g, ""));
			const price =
				parseFloat(
					$(el)
						.find(".price-neww")
						.text()
						.trim()
						.replace(/[\$\*]/g, "")
				) || "NA";
			const link = process.env.BENCHMARK_SITE + "/" + $(el).find("> a").attr("href");
			cpus.push({ name, sThread, price, link });
		});

		const minSThread = 3432;
		cpus = cpus.filter((cpu) => cpu.sThread >= minSThread && cpu.price !== "NA");
		cpus.sort((a, b) => b.sThread - a.sThread);
		const cpuPromises = cpus.map(async (cpu, index) => {
			try {
				const instance = await getNextInstance();
				if (instance === null) throw new Error("No more instances available");
				const res = await instance.get(cpu.link);

				const $ = cheerio.load(res.data);

				const body = $(".ov-scroll");

				const findByStrong = (text) =>
					body.find(`strong:contains(${text})`).parent().text().replace(new RegExp(text, "g"), "").trim();
				const findNextTextNodeByStrong = (text) => {
					const nodes = body
						.find(`strong:contains(${text})`)
						.parent()
						.contents()
						.filter(() => true);
					for (let i = 0; i < nodes.length; i++) {
						const node = cheerio.load(nodes[i]);
						if (node.text().trim() === text) return nodes[i + 1].data.trim();
					}
					return "";
				};

				const graphics = findByStrong("Description:");
				const type = findByStrong("Class:");
				const socket = findByStrong("Socket:");
				const cores = findNextTextNodeByStrong("Cores:");
				const threads = findNextTextNodeByStrong("Threads:");
				const clockSpeed = findByStrong("Clockspeed:");
				const turboSpeed = findByStrong("Turbo Speed:");
				const tdp = findByStrong("Typical TDP:");
				const tdpMax = findByStrong("TDP Up:");
				const mark = body.find(".speedicon").next().text().trim();
				const sThreadMark = findNextTextNodeByStrong("Single Thread Rating:");

				console.log(`Fetched: ${cpu.link}`);
				return {
					...cpu,
					graphics,
					type,
					socket,
					cores,
					threads,
					clockSpeed,
					turboSpeed,
					tdp,
					tdpMax,
					mark,
					sThreadMark,
				};
			} catch (error) {
				console.log(error);
			}
		});
		cpus = await Promise.all(cpuPromises);

		writeFileSync(getFilePath("../../data/cpus.json", import.meta.url), JSON.stringify(cpus));
		console.log("Nombre de processeurs scanné :", cpus.length);
	} catch (error) {
		console.log(error);
	}
}
