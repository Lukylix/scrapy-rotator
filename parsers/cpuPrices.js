const maxPagesWithoutProduct = 5;

let pagesWithoutProduct = 0;
export function parseCPUsPage($) {
	let cpusFounds = [];
	$(".itemIn").each((i, el) => {
		const productName = $(el).find("h3").text().trim();
		const procductLink = $(el).find("h3 a").attr("href");
		const price = $(el).find(".itemPrice .cenaDph strong").text();
		if ((productName, price)) cpusFounds.push({ productName, procductLink, price });
	});

	let nextPage = parseInt($(".navig > #buttonNextPage").attr("href")?.match(/(\d+)/)[1]);
	if (isNaN(nextPage) || !nextPage) nextPage = -1;
	if (cpusFounds.length === 0) pagesWithoutProduct++;
	if (pagesWithoutProduct >= maxPagesWithoutProduct) nextPage = -1;

	return [cpusFounds, nextPage];
}
