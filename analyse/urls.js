import { getFilePath } from "../utils/getFilePath.js";
import { readFileSync } from "../utils/readFileSync.js";

export function retriveRequests() {
	let requests = JSON.parse(readFileSync(getFilePath("../data/requests.json", import.meta.url)));
	requests.forEach((request) => {
		const { url, requestBody } = request;
		console.log({ url, requestBody });
	});
}
