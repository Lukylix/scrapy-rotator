import dotenv from "dotenv";

dotenv.config();

export async function parseCPUsList($) {
	let cpus = [];
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
	return cpus;
}

export async function parseCPUInfos({ $, cpu }) {
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
}
