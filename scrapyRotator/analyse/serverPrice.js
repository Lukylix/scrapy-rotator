import { readFileSync } from "../utils";

// Only work with Epyc for now
let cpus = JSON.parse(readFileSync("../common/data/cpusWithPrice.json"));
const prices = {
	ram: 6558.96,
	nvme: 1788.96,
	server: 2229,
};
cpus.forEach((cpu, i) => {
	const serverPrice = Object.values(prices).reduce((acc, val) => acc + val) + cpu.price;
	cpus[i] = { ...cpu, serverPrice };
});
cpus.sort((a, b) => a.serverPrice > b.serverPrice);
cpus.forEach((cpu) => {
	console.log(
		`${cpu?.name} ${cpu.cores} cores | sThreadMark:${cpu.sThreadMark}  mark:${cpu.mark}, tdp:${cpu.tdp}, serverPrice:${cpu.serverPrice}`
	);
});
