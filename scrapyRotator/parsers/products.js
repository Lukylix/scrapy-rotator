export function parseProducts($) {
	let products = [];
	$("#data-plp_produits .product-grid-item").each((i, el) => {
		const linkElement = $(el).find(".product-card-title");
		const link = linkElement.attr("href");
		const name = linkElement.text().trim();
		const price = $(el).find(".product-price__amount-value").text().trim();
		const image = $(el).find(".product-card-image__image").attr("data-src");
		const perUnitPrice = $(el).find(".main-vertical--infos").text().trim();

		if (link && name && price && image) products.push({ link, name, price, image, perUnitPrice });
	});
	return products;
}
