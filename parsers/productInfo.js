const nutricionalNamesDic = {
	"valeur énergétique (kJ)": "kj",
	"valeur énergétique (kcal)": "kcal",
	"Matieres grasses": "fat",
	"Dont acides gras saturés": "acideFat",
	Glucides: "glucid",
	"Dont sucres": "sucar",
	Protéines: "protein",
	Sel: "salt",
};

export function getProductInfo($) {
	const ingredients = $(".product-block-content span").text().trim();
	const name = $(".pdp-card__title").text().trim();
	const description = $(".product-description .ds-body-text").text().trim();
	const nutricionalScoreImg = $(".product-badge-anchor__svg img").attr("src");
	let nutricionalScore = "";
	if (nutricionalScoreImg)
		nutricionalScore = nutricionalScoreImg
			.split()
			.pop()
			.match(/\w(?=\.)/)[0];
	const images = $(".pdp-hero__thumbs button img").attr("src");
	let nutricionalValues = [];
	$(".nutritional-fact").each((i, fact) => {
		const factName = $(fact).find(".nutritional-fact__name").text().trim();
		const factNameShorthand = nutricionalNamesDic[factName.trim()] || factName;
		const factValue = $(fact).find(".nutritional-fact__center").text().trim();

		nutricionalValues.push({ name: factNameShorthand, value: factValue });
	});
	return { name, description, images, nutricionalScore, ingredients, nutricionalValues };
}
