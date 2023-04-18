import fs from "fs";

import { getFilePath } from "../utils/getFilepath.js";

export function retriveCPUs({ name, minCores }) {
	let cpus = JSON.parse(fs.readFileSync(getFilePath("../data/cpusWithPrice.json", import.meta.url)));
	cpus = cpus.filter((cpu) => cpu?.name.toLowerCase().includes(name) && cpu?.cores >= minCores);
	cpus.forEach((cpu) => {
		console.log(
			`${cpu.name} ${cpu.cores} cores sThread:${cpu.sThreadMark} mark:${cpu.mark} tdp:${cpu.tdp} price:${cpu.price}`
		);
	});
}
