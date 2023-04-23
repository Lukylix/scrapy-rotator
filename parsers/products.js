export function getProducts($) {
	let products = [];
	$("#data-plp_produits .product-grid-item").each((i, el) => {
		const linkElement = $(".product-card-title");
		const link = linkElement.attr("href");
		const name = linkElement.text().trim();
		const price = $(".product-price__amount-value").text().trim();
		const image = $(".product-card-image__image").attr("data-src");
		const perUnitPrice = $(".main-vertical--infos").text().trim();

		if (link && name && price && image) products.push({ link, name, price, image, perUnitPrice });
	});
	return products;
}
