import { getProxyConfiguration, setProxies } from "../../clients/crawlee.js";
import { chromium } from "playwright";
import { getFilePath, writeFileSync, parseJSON } from "../../utils/index.js";
import dotenv from "dotenv";
import { PlaywrightCrawler, CheerioCrawler } from "crawlee";
import { parseProducts } from "../../parsers/index.js";
import { getCookies } from "./common/requestsMiddleware.js";

dotenv.config();

const routes = {
	// me: `${process.env.SUPERMARKET_SITE}/api/me`,
	stores: `${process.env.CATALOGUES_SITE}/api/v2/stores`,
	store: `${process.env.CATALOGUES_SITE}/api/campaigns/stores/`,
	rayon: `${process.env.SUPERMARKET_SITE}/r`,
};

let cookies = [];

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
	if (!process.env.SUPERMARKET_SITE) throw new Error("SUPERMARKET_SITE is not defined");
	await crawler.run([`${process.env.SUPERMARKET_SITE}/catalogue`]);
	let responses = [];
	let products = [];
	let nextPage = 1;
	let productNotFoundInARaw = 0;
	let lastPageWithZeroProduct = 0;
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
			const bodyJSON = parseJSON(body);
			responses.push({ url, body: bodyJSON.length > 0 ? bodyJSON : body });
			if (url.includes(routes.stores)) {
				const store = bodyJSON.find((store) => store.name.includes("Market Nimes Painleve"));
				await crawler.addRequests([
					`${process.env.CATALOGUES_SITE}/api/campaigns/stores/${store.code}`,
					`${process.env.SUPERMARKET_SITE}/r?page=1`,
				]);
			} else if (url.includes(routes.rayon)) {
				const productsToAdd = parseProducts($);
				const nextPageURL = `${process.env.SUPERMARKET_SITE}/r?`;
				products = [...products, ...productsToAdd];
				const paramsString = url.split("?")[1].split(/[&\$]/);
				let params = {};
				paramsString.forEach((param) => {
					const [key, value] = param.split("=");
					params[key] = value;
				});
				nextPage = parseInt(params.page);

				if (productsToAdd.length === 0) {
					let retryCount = parseInt(params.retrycount) || 0;
					if (retryCount < 10 && nextPage > lastPageWithZeroProduct) {
						retryCount++;
						return await crawler.addRequests([`${nextPageURL}retrycount=${retryCount}&page=${nextPage}`]);
					}
					if (retryCount >= 10 && (nextPage < lastPageWithZeroProduct || lastPageWithZeroProduct === 0))
						lastPageWithZeroProduct = nextPage;
					productNotFoundInARaw++;
				}
				if (productsToAdd.length > 0) productNotFoundInARaw = 0;
				if (productNotFoundInARaw > 10) return;

				const concurrentExploration = 20;
				if (nextPage % concurrentExploration === 1) {
					let urlsToAdd = [];
					for (let i = 0; i < concurrentExploration; i++) {
						nextPage++;
						urlsToAdd.push(`${nextPageURL}page=${nextPage}`);
					}
					await crawler.addRequests(urlsToAdd);
				}
			}
		},
	});
	await crawlerCheerio.run([
		// `${process.env.CATALOGUES_SITE}/api/v2/stores?latitude=43.861721&longitude=4.374104237499999`,
		`${process.env.SUPERMARKET_SITE}/r?page=1`,
	]);
	writeFileSync(getFilePath("../../../common/data/products.json", import.meta.url), JSON.stringify(products));
	writeFileSync(getFilePath("../../../common/data/responses.json", import.meta.url), JSON.stringify(responses));
}
