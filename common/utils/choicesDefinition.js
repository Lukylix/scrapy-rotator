import {
	cpuBenchmarkAxios,
	cpuPricesAxios,
	cpuBenchmarkCrawlee,
	cpuPricesCrawlee,
	productsPlaywright,
	productsWithInfosPlaywright,
} from "../../scrapyRotator/crawlers/index.js";
import { getFreeProxies, getPremiumProxies } from "../../scrapyRotator/utils/index.js";
import { importProductsFromJson } from "../../scrapyRotator/scripts/importProductsFromJson.js";

export const tasks = [
	{ value: "elastic-run", name: "Run ElasticSearch", for: "elasticsearch", checked: true },
	{ value: "backend", name: "Lancer l'API", for: "backend", checked: true },
	{ value: "frontend", name: "Lancer le frontend", for: "frontend", checked: true, depends: ["backend"] },

	{
		value: "cpu-benchmark",
		name: "Recuperer le score des processeurs",
		for: "scrapy",
		checked: false,
		backends: ["crawlee", "axios"],
		get: {
			crawlee: cpuBenchmarkCrawlee,
			axios: cpuBenchmarkAxios,
		},
	},
	{
		value: "cpu-prices",
		name: "Récuperer le prix des processeurs",
		for: "scrapy",
		checked: false,
		backends: ["crawlee", "axios"],
		depends: ["cpu-benchmark"],
		get: {
			crawlee: cpuPricesCrawlee,
			axios: cpuPricesAxios,
		},
	} /*
	{
		value: "cpu-filter",
		name: "Filtrer les processeurs",
		for: "scrapy",
		checked: false,
		depends: ["cpu-benchmark", "cpu-filter"],
		do: cpuF,
	},*/,
	{
		value: "products",
		name: "Récuperer les produits du supermarché",
		for: "scrapy",
		checked: false,
		backends: ["playwright"],
		get: {
			playwright: productsPlaywright,
		},
	},
	{
		value: "import-products-to-db",
		name: "Importer les produits dans la base de données",
		for: "scrapy",
		checked: false,
		depends: ["products"],
		do: importProductsFromJson,
	},
	{
		value: "products-infos",
		name: "Récuperer les infos produits",
		for: "scrapy",
		checked: false,
		backends: ["playwright"],
		depends: ["products"],
		get: {
			playwright: productsWithInfosPlaywright,
		},
	},
];

export const storage = [
	{ value: "db", name: "ElasticSearch database" },
	{ value: "json", name: "Json file" },
];

export const proxies = [
	{ value: "premium", name: "Premium", checked: true, get: getFreeProxies },
	{ value: "free", name: "Free", checked: false, get: getPremiumProxies },
];
