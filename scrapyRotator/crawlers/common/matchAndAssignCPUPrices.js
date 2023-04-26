export function matchAndAssignCPUPrices({ cpus, totalCpusFounds }) {
	let cpusCopy = [...cpus];
	cpusCopy.forEach((cpu, i) => {
		const name = cpu.name.replace(/AMD/g, "").trim();
		let price = totalCpusFounds
			.find((cpu) => {
				const nameArray = name.toLowerCase().split(" ");
				return nameArray.every((word) => cpu?.productName?.toLowerCase().includes(word));
			})
			?.price.replace(/[€\s]/g, "");
		const pricefloat = parseFloat(price);
		if (!isNaN(pricefloat)) price = pricefloat;
		if (price) cpusCopy[i] = { ...cpu, price };
	});
	return cpusCopy.filter((cpu) => cpu.price < 10);
}
