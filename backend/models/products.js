import { client } from "../config/elasticsearch.js";

const indexName = "super-market-products";

const productMapping = {
	dynamic: true,
	properties: {
		name: { type: "text" },
		description: { type: "text" },
		images: { type: "text" },
		nutricionalScore: { type: "keyword" },
		ingredients: { type: "text" },
		pricePerQuantityPerKcal: { type: "float" },
		nutricionalValues: { type: "object" },
		link: { type: "text", index: true },
		price: { type: "keyword" },
		image: { type: "text" },
		perUnitPrice: {
			properties: {
				quantity: { type: "keyword" },
				unit: { type: "keyword" },
				pricePer: { type: "keyword" },
				pricePerUnit: { type: "keyword" },
			},
		},
		createdAt: { type: "date" },
		updatedAt: { type: "date" },
	},
};

export { indexName, productMapping };
