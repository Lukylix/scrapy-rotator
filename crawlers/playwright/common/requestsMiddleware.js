const bannedHosts = ["cookielaw.org", "bugsnag.com", "criteo.com"];
let requests = [];
export async function getCookies({ request, page, enqueueLinks, log, proxyInfo }) {
	console.log(`Fetched: ${request.url} ${proxyInfo?.hostname}:${proxyInfo?.port}`);
	page.route("**/*", async (route) => {
		const { hostname } = new URL(route.request().url());
		if (bannedHosts.some((host) => hostname.includes(host))) return await route.abort();
		return route.request().resourceType() === "image" ? await route.abort() : route.continue();
	});
	return await page.context().cookies();
}

export async function getRequest({ request, page, enqueueLinks, log, proxyInfo }) {
	console.log(`Fetched: ${request.url} ${proxyInfo?.hostname}:${proxyInfo?.port}`);

	page.route("**/*", async (route) => {
		const { hostname } = new URL(route.request().url());
		if (bannedHosts.some((host) => hostname.includes(host))) return await route.abort();
		return route.request().resourceType() === "image" ? await route.abort() : route.continue();
	});
	page.on("response", async (response) => {
		const request = response.request();
		const resourceType = request.resourceType();
		if (resourceType !== "xhr" && resourceType !== "fetch") return;
		const { hostname } = new URL(response.url());
		if (bannedHosts.some((host) => hostname.includes(host))) return;
		console.log("Response ", request.url(), request.resourceType());
		const requestIndex = requests.findIndex((val) => val.url === response.url());
		if (requestIndex >= 0) {
			requests[requestIndex] = { ...requests[requestIndex], body: parseJSON(await response.body()) };
		} else {
			requests.push({
				url: response.url(),
				method: request.method(),
				headers: await request.allHeaders(),
				requestBody: parseJSON(request.postData()),
				body: parseJSON(await response.body()),
			});
		}
		writeFileSync(getFilePath("../../data/requests.json", import.meta.url), JSON.stringify(requests));
	});

	return await page.context().cookies();
}
