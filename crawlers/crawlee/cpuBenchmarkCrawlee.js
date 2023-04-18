import { CheerioCrawler } from "crawlee";
import { getProxyConfiguration, setProxies } from "../../clients/proxiesClientCrawlee.js";
import { getFilePath } from "../../utils/getFilepath.js";
import fs from "fs";
import dotenv from "dotenv";
import { writeFileSync } from "../../utils/writeFileSync.js";

dotenv.config();

let cpus = [];
let cpusInfos = [];
async function scrapeList({ $, request, enqueueLinks }) {
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
	await enqueueLinks({
		selector: ".chartlist li > a",
	});
}

async function scrapeCpuInfos({ $, request }) {
	const body = $(".ov-scroll");
	const cpu = cpus.find((cpu) => request.loadedUrl.includes(cpu.link));
	const findByStrong = (text) =>
		body.find(`strong:contains(${text})`).parent().text().replace(new RegExp(text, "g"), "").trim();
	const findNextTextNodeByStrong = (text) => {
		const nodes = body
			.find(`strong:contains(${text})`)
			.parent()
			.contents()
			.filter(() => true);
		for (let i = 0; i < nodes.length; i++) {
			const node = $.load(nodes[i]);
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

	cpusInfos.push({
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
	});
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
	writeFileSync(getFilePath("../../data/cpus.json", import.meta.url), JSON.stringify(cpusInfos));
	console.log("Nombre de processeurs scanné :", cpusInfos.length);
}
