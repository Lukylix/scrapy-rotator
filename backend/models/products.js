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
};

const filterTypes = {
	keys: [
		"nutricionalScore",
		"nutricionalValues.kcal",
		"nutricionalValues.matières grasses",
		"nutricionalValues.saturatedFat",
		"price",
		"name",
		"description",
		"perUnitPrice.pricePerUnit",
		"perUnitPrice.pricePer",
		"perUnitPrice.quantity",
		"perUnitPrice.unit",
	],
	types: ["term", "range", "match"],
	operationsRange: ["gt", "gte", "lt", "lte", "eq", "ne"],
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
		sorts = JSON.parse(sorts);
		sorts = Array.isArray(sorts) ? sorts : [sorts];
		sorts = sorts.filter((sort) => sort !== "");
		filters = JSON.parse(filters);

		const hits = await client.search({
			index: indexName,
			from: (page - 1) * pageSize,
			size: pageSize,
			body:
				search.length > 2
					? {
							query: {
								multi_match: {
									query: search,
									fields: ["name^3", "description"],
								},

								sort:
									sorts.length > 0
										? [
												...sorts.map((sort, i) => ({
													...sortProperties[sort],
													boost: i * filters.length - filters.length + 1,
												})),
												{ "perUnitPrice.pricePer": { order: "desc" } },
										  ]
										: [{ "perUnitPrice.pricePer": { order: "desc" } }],
								bool: {
									filter:
										filters.length > 0
											? filters.map((filter, i) => {
													const { property, type, operator, value } = filter;
													return {
														[type]:
															type === "match"
																? {
																		[property]: {
																			query: value,
																			operator: "AND",
																			boost: i * filters.length - filters.length + 1,
																			auto_generate_synonyms_phrase_query: true,
																		},
																  }
																: { [property]: operator ? { [operator]: value } : value },
													};
											  })
											: undefined,
								},
							},
					  }
					: {
							sort:
								sorts.length > 0
									? [...sorts.map((sort) => sortProperties[sort]), { "perUnitPrice.pricePer": { order: "desc" } }]
									: [{ "perUnitPrice.pricePer": { order: "desc" } }],
							query: {
								// match_all: {},

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
										filters.length > 0 ? filters.map((filter) => ({ exists: { field: filter.property } })) : undefined,
									must_not:
										filters.length > 0 ? filters.map((filter) => ({ term: { [filter.property]: "" } })) : undefined,
								},
							},
					  },
		});
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
			console.log(`Product with link ${product.link} already exists in index.`);
			return hits.hits.hits[0];
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
		console.log(`Updated product with id: ${result}`);
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
		console.log(`Deleted product with id: ${result}`);
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
