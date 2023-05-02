import { client } from "../config/elasticsearch.js";
import { indexName, productMapping } from "../models/products.js";

const sortProperties = {
	"price-asc": { price: { order: "asc", unmapped_type: "float" } },
	"price-desc": { price: { order: "desc", unmapped_type: "float" } },
	"nutricionalScore-asc": { nutricionalScore: { order: "asc", unmapped_type: "keyword" } },
	"nutricionalScore-desc": { nutricionalScore: { order: "desc", unmapped_type: "keyword" } },
	"name-asc": { name: { order: "asc", unmapped_type: "keyword" } },
	"name-desc": { name: { order: "desc", unmapped_type: "keyword" } },
	"score-asc": { nutricionalScore: { order: "asc", unmapped_type: "keyword" } },
	"score-desc": { nutricionalScore: { order: "desc", unmapped_type: "keyword" } },
	"price-per-unit-asc": { "perUnitPrice.pricePerUnit": { order: "asc", unmapped_type: "keyword" } },
	"price-per-unit-desc": { "perUnitPrice.pricePerUnit": { order: "desc", unmapped_type: "keword" } },
	"price-per-asc": { "perUnitPrice.pricePer": { order: "asc", unmapped_type: "float" } },
	"price-per-desc": { "perUnitPrice.pricePer": { order: "desc", unmapped_type: "float" } },
	"price-per-unit-price-asc": { "perUnitPrice.pricePerUnit": { order: "asc", unmapped_type: "keyword" } },
	"price-per-unit-price-desc": { "perUnitPrice.pricePerUnit": { order: "desc", unmapped_type: "keyword" } },
	"price-per-unit-quantity-asc": { "perUnitPrice.quantity": { order: "asc", unmapped_type: "keyword" } },
	"price-per-unit-quantity-desc": { "perUnitPrice.quantity": { order: "desc", unmapped_type: "keyword" } },
	"kj-asc": { "nutricionalValues.kj": { order: "asc", unmapped_type: "float" } },
	"kj-desc": { "nutricionalValues.kj": { order: "desc", unmapped_type: "float" } },
	"kcal-asc": { "nutricionalValues.kcal": { order: "asc", unmapped_type: "float" } },
	"kcal-desc": { "nutricionalValues.kcal": { order: "desc", unmapped_type: "float" } },
	"fat-asc": { "nutricionalValues.matières grasses": { order: "asc", unmapped_type: "float" } },
	"fat-desc": { "nutricionalValues.matières grasses": { order: "desc", unmapped_type: "float" } },
	"saturated-fat-asc": { "nutricionalValues.saturatedFat": { order: "asc", unmapped_type: "float" } },
	"saturated-fat-desc": { "nutricionalValues.saturatedFat": { order: "desc", unmapped_type: "float" } },
	"glucid-asc": { "nutricionalValues.glucides": { order: "asc", unmapped_type: "float" } },
	"glucid-desc": { "nutricionalValues.glucides": { order: "desc", unmapped_type: "float" } },
	"sugar-asc": { "nutricionalValues.sucres": { order: "asc", unmapped_type: "float" } },
	"sugar-desc": { "nutricionalValues.sucres": { order: "desc", unmapped_type: "float" } },
	"protein-asc": { "nutricionalValues.proteines": { order: "asc", unmapped_type: "float" } },
	"protein-desc": { "nutricionalValues.proteines": { order: "desc", unmapped_type: "float" } },
	"salt-asc": { "nutricionalValues.sel": { order: "asc", unmapped_type: "float" } },
	"salt-desc": { "nutricionalValues.sel": { order: "desc", unmapped_type: "float" } },
	"price-per-quantity-kcal-asc": {
		"nutricionalValuesPerPricePerQuantity.kcal": { order: "asc", unmapped_type: "float" },
	},
	"price-per-quantity-kcal-desc": {
		"nutricionalValuesPerPricePerQuantity.kcal": { order: "desc", unmapped_type: "float" },
	},
	"price-per-quantity-kj-asc": { "nutricionalValuesPerPricePerQuantity.kj": { order: "asc", unmapped_type: "float" } },
	"price-per-quantity-kj-desc": {
		"nutricionalValuesPerPricePerQuantity.kj": { order: "desc", unmapped_type: "float" },
	},
	"price-per-quantity-fat-asc": {
		"nutricionalValuesPerPricePerQuantity.fat": { order: "asc", unmapped_type: "float" },
	},
	"price-per-quantity-fat-desc": {
		"nutricionalValuesPerPricePerQuantity.fat": { order: "desc", unmapped_type: "float" },
	},
	"price-per-quantity-saturated-fat-asc": {
		"nutricionalValuesPerPricePerQuantity.saturatedFat": { order: "asc", unmapped_type: "float" },
	},
	"price-per-quantity-saturated-fat-desc": {
		"nutricionalValuesPerPricePerQuantity.saturatedFat": { order: "desc", unmapped_type: "float" },
	},
	"price-per-quantity-glucid-asc": {
		"nutricionalValuesPerPricePerQuantity.glucides": { order: "asc", unmapped_type: "float" },
	},
	"price-per-quantity-glucid-desc": {
		"nutricionalValuesPerPricePerQuantity.glucides": { order: "desc", unmapped_type: "float" },
	},
	"price-per-quantity-sugar-asc": {
		"nutricionalValuesPerPricePerQuantity.sucres": { order: "asc", unmapped_type: "float" },
	},
	"price-per-quantity-sugar-desc": {
		"nutricionalValuesPerPricePerQuantity.sucres": { order: "desc", unmapped_type: "float" },
	},
	"price-per-quantity-protein-asc": {
		"nutricionalValuesPerPricePerQuantity.proteines": { order: "asc", unmapped_type: "float" },
	},
	"price-per-quantity-protein-desc": {
		"nutricionalValuesPerPricePerQuantity.proteines": { order: "desc", unmapped_type: "float" },
	},
	"price-per-quantity-salt-asc": {
		"nutricionalValuesPerPricePerQuantity.sel": { order: "asc", unmapped_type: "float" },
	},
	"price-per-quantity-salt-desc": {
		"nutricionalValuesPerPricePerQuantity.sel": { order: "desc", unmapped_type: "float" },
	},
};

const filterTypes = {
	keys: [
		"nutricionalScore",
		"price",
		"name",
		"description",
		"perUnitPrice.pricePerUnit",
		"perUnitPrice.pricePer",
		"perUnitPrice.quantity",
		"perUnitPrice.unit",
		"pricePerQuantityPerKcal",
		"nutricionalValues.kj",
		"nutricionalValues.kcal",
		"nutricionalValues.fat",
		"nutricionalValues.saturatedFat",
		"nutricionalValues.glucid",
		"nutricionalValues.sugar",
		"nutricionalValues.protein",
		"nutricionalValues.salt",
		"nutricionalValuesPerPricePerQuantity.kj",
		"nutricionalValuesPerPricePerQuantity.kcal",
		"nutricionalValuesPerPricePerQuantity.fat",
		"nutricionalValuesPerPricePerQuantity.saturatedFat",
		"nutricionalValuesPerPricePerQuantity.glucid",
		"nutricionalValuesPerPricePerQuantity.sugar",
		"nutricionalValuesPerPricePerQuantity.protein",
		"nutricionalValuesPerPricePerQuantity.salt",
	],
	types: ["term", "range", "match"],
	operationsRange: ["gt", "gte", "lt", "lte"],
};

const getFilterProperties = () => {
	return filterTypes;
};

const getSortProperties = () => {
	return Object.keys(sortProperties);
};

const createProductIndex = async () => {
	try {
		const indexExists = await client.indices.exists({ index: indexName });
		if (!indexExists) {
			await client.indices.create({
				index: indexName,
				body: {
					mappings: productMapping,
				},
			});
			console.log(`Created Elasticsearch index: ${indexName}`);
		}
	} catch (error) {
		console.error(`Error creating Elasticsearch index: ${indexName}`);
		console.error(error);
	}
};

const getProducts = async (page, pageSize, filters = [], search = "", sorts) => {
	try {
		await createProductIndex();
		// try to parse json array if fails return empty array
		sorts = JSON.parse(sorts || "[]");

		console.log("sorts", sorts);
		sorts = Array.isArray(sorts) ? sorts : [sorts];
		sorts = sorts.filter((sort) => sort !== "");
		filters = JSON.parse(filters);
		console.log("search", search);
		const hits = await client.search({
			index: indexName,
			from: (page - 1) * pageSize,
			size: pageSize,
			body: {
				sort:
					sorts.length > 0
						? [...sorts.map((sort) => sortProperties[sort]), { "perUnitPrice.pricePer": { order: "desc" } }]
						: [{ "perUnitPrice.pricePer": { order: "desc" } }],

				query: {
					bool: {
						filter:
							filters.length > 0
								? filters.map((filter) => {
										const { property, type, operator, value } = filter;
										return {
											[type]:
												type === "match"
													? {
															[property]: {
																query: value,
																operator: "AND",
																auto_generate_synonyms_phrase_query: true,
															},
													  }
													: { [property]: operator ? { [operator]: value } : value },
										};
								  })
								: undefined,
						must:
							filters.length > 0 || search.length > 0
								? [
										search.length > 3
											? {
													multi_match: {
														query: search,
														fields: ["name^3", "description"],
														type: "cross_fields",
													},
											  }
											: {
													match_all: {},
											  },
										...filters.map((filter) => ({ exists: { field: filter.property } })),
								  ]
								: undefined,
						must_not: filters.length > 0 ? filters.map((filter) => ({ term: { [filter.property]: "" } })) : undefined,
					},
				},
			},
		});
		console.log("hits", hits.hits.total.value);
		if (!hits.hits.total.value === 0)
			return { page, pageSize, total: hits.hits.total.value || 1, totalPages: 0, products: [] };
		const products = hits.hits.hits?.map((product) => product._source);

		return {
			page,
			pageSize,
			total: hits.hits.total.value,
			products: products,
			totalPages: Math.ceil(hits.hits.total.value / pageSize) || 1,
		};
	} catch (error) {
		console.error("Error retrieving products:");
		console.error(error);
	}
};

const insertProduct = async (product) => {
	try {
		await createProductIndex();

		const hits = await client.search({
			index: indexName,
			body: {
				query: {
					match_phrase: {
						link: product.link,
					},
				},
			},
		});
		if (hits.hits.total.value == 0) {
			const result = await client.index({
				index: indexName,
				body: {
					...product,
				},
			});
			console.log(`Inserted product with id: ${result._id}`);
			return result;
		} else {
			const result = await updateProduct({ ...hits.hits.hits[0]._source, id: hits.hits.hits[0]._id });
			return result;
		}
	} catch (error) {
		console.error(`Error inserting product: ${product.name}`);
		console.error(error);
	}
};

const updateProduct = async (product) => {
	try {
		await createProductIndex();
		const result = await client.update({
			index: indexName,
			id: product.id,
			body: {
				doc: {
					...product,
				},
			},
		});
		console.log(`Updated product with id: ${result._id}`);
		return result;
	} catch (error) {
		console.error(`Error updating product: body${product.name}`);
		console.error(error);
	}
};

const deleteProduct = async (id) => {
	try {
		await createProductIndex();
		const result = await client.delete({
			index: indexName,
			id: id,
		});
		console.log(`Deleted product with id: ${result._id}`);
		return result.body;
	} catch (error) {
		console.error(`Error deleting product with id: ${id}`);
		console.error(error);
	}
};

const getProduct = async (link) => {
	try {
		await createProductIndex();
		const result = await client.search({
			index: indexName,
			body: {
				query: {
					match: {
						link: link,
					},
				},
			},
		});
		return result;
	} catch (error) {
		console.error(`Error getting product with link: ${link}`);
		console.error(error);
	}
};

export {
	getProducts,
	getFilterProperties,
	getSortProperties,
	getProduct,
	deleteProduct,
	updateProduct,
	createProductIndex,
	insertProduct,
};
