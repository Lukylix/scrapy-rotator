import { getFilePath, readFileSync } from "../utils";

export function retriveCPUs({ name, minCores }) {
	let cpus = JSON.parse(readFileSync(getFilePath("../../common/data/cpusWithPrice.json", import.meta.url)));
	cpus = cpus.filter((cpu) => cpu?.name.toLowerCase().includes(name) && cpu?.cores >= minCores);
	cpus.forEach((cpu) => {
		console.log(
			`${cpu.name} ${cpu.cores} cores sThread:${cpu.sThreadMark} mark:${cpu.mark} tdp:${cpu.tdp} price:${cpu.price}`
		);
	});
}
