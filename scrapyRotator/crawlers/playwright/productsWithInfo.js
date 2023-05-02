import { getProxyConfiguration, setProxies } from "../../clients/crawlee.js";
import { chromium, firefox, webkit } from "playwright";
import { getFilePath, writeFileSync, readFileSync, parseJSON } from "../../utils/index.js";
import dotenv from "dotenv";
import { PlaywrightCrawler, CheerioCrawler } from "crawlee";
import { getCookies } from "./common/requestsMiddleware.js";
import { parseProductInfo } from "../../parsers/index.js";

dotenv.config();

const routes = {
	product: `${process.env.SUPERMARKET_SITE}/p`,
};

let cookies = [];

const nutricionalNamesDic = {
	"valeur energetique (kJ)": "kj",
	"valeur energetique (kcal)": "kcal",
	"Matieres grasses": "fat",
	"Dont acides gras satures": "staturatedFat",
	Glucides: "glucid",
	"Dont sucres": "sugar",
	Proteines: "protein",
	Sel: "salt",
};

export function refactorProducts(products) {
	return products.map((product) => {
		let nutricionalValuesObject = {};
		if (product.nutricionalValues)
			Object.keys(product.nutricionalValues).forEach((nutricionalkey) => {
				const nutricionalValue = product.nutricionalValues[nutricionalkey];
				const key = nutricionalNamesDic[nutricionalValue.name] || nutricionalValue.name;
				const [nutricionalValueText, perQuantity] = nutricionalValue.value.split("/");
				const [value, unit] = nutricionalValueText?.split(" ") || [nutricionalValueText, ""];
				const [quantity, quantityUnit] = perQuantity?.split(" ") || [perQuantity, ""];
				nutricionalValuesObject[key] = { value, unit, quantity: { value: quantity, unit: quantityUnit } };
			});
		let perUnitPrice = {};
		if (product.perUnitPrice !== "") {
			const regex = /^(\d+)\s?(\S+)\D+\s+(\d+\.\d+)\s*€\s*\/\s*(\w+)/gm;
			const match = regex.exec(product.perUnitPrice.trim());
			let quantity2, unit2, pricePer, pricePerUnit;
			if (match !== null) {
				[, quantity2, unit2, pricePer, pricePerUnit] = match;
			} else {
				const regex2 = /\s*(\d+\.\d+).+\/\s+(\S+)/gm;
				const match2 = regex2.exec(product.perUnitPrice);
				if (match2 !== null) [, pricePer, pricePerUnit] = match2;
			}

			perUnitPrice = { quantity: quantity2, unit: unit2, pricePer, pricePerUnit };
		}
		let nutricionalValuesPerPricePerQuantity = {};
		if (perUnitPrice?.pricePer) {
			nutricionalValuesPerPricePerQuantity = Object.keys(nutricionalValuesObject).reduce((acc, nutricionalkey) => {
				acc[nutricionalkey] =
					(parseInt(nutricionalValuesObject[nutricionalkey]) * 100) / parseFloat(perUnitPrice.pricePer);
			}, {});
		}
		return {
			...product,
			perUnitPrice,
			nutricionalValues: nutricionalValuesObject,
			nutricionalValuesPerPricePerQuantity,
		};
	});
}

export default async function main(proxies) {
	setProxies(proxies);
	const crawler = new PlaywrightCrawler({
		launchContext: {
			launcher: chromium,
			// Here you can set options that are passed to the playwright .launch() function.
			launchOptions: {
				headless: true,
				navigationTimeout: 58 * 60 * 1000,
				viewport: { width: 1920, height: 1080 },
			},
		},

		proxyConfiguration: getProxyConfiguration(),
		useSessionPool: true,
		persistCookiesPerSession: true,
		requestHandlerTimeoutSecs: 60 * 10,
		maxRequestRetries: 1000,
		navigationTimeoutSecs: 20,
		requestHandler: getCookies,
	});
	await crawler.run([`${process.env.SUPERMARKET_SITE}/catalogue`]);

	let products = parseJSON(readFileSync(getFilePath("../../../common/data/products.json", import.meta.url)));
	console.log("Products: ", products.length);
	const crawlerCheerio = new CheerioCrawler({
		maxRequestRetries: 50,
		proxyConfiguration: getProxyConfiguration(),
		useSessionPool: true,
		persistCookiesPerSession: true,
		preNavigationHooks: [
			async (crawlingContext, gotOptions) => {
				crawlingContext.session.setCookies(cookies);
			},
		],
		requestHandler: async ({ session, request, response, body, $, crawler, proxyInfo }) => {
			console.log(`Fetched: ${request.url} ${proxyInfo.hostname}:${proxyInfo.port}`);
			const url = request.url;

			if (url.includes(routes.product)) {
				const product = await parseProductInfo($);
				const productIndex = products.findIndex((productBase) => productBase.name.includes(product.name));
				products[productIndex] = { ...product, ...products[productIndex] };
			}
		},
	});

	const urlsToFetch = products.map((product) => `${process.env.SUPERMARKET_SITE}${product.link}`);

	console.log("URLs to fetch: ", urlsToFetch.length);
	await crawlerCheerio.run(urlsToFetch);
	products = refactorProducts(products);

	writeFileSync(getFilePath("../../../common/data/productsWithInfos.json", import.meta.url), JSON.stringify(products));
}
