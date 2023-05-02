import fs from "fs";
import { getProducts, insertProduct } from "../../common/utils/api.js";
import { getFilePath } from "../utils/getFilePath.js";
import axios from "axios";

const importProductsFromJson = async () => {
	let products = JSON.parse(
		fs.readFileSync(getFilePath("../../common/data/productsWithInfos.json", import.meta.url), "utf8")
	);
	console.log("products", products.length);
	try {
		//Wait for api to be ready
		let res = null;
		while (res?.data?.message !== "I'm ready!") {
			try {
				console.log("Waiting for api to be ready...");
				res = await axios.get("http://localhost:3000/ready");
				if (!res) await setTimeout(() => {}, 5000);
			} catch (error) {}
		}
		let productsInDB = [];
		let totalPages = 1000;
		let page = 1;
		while (page <= totalPages) {
			const productsPage = await getProducts(page);
			totalPages = productsPage.totalPages;
			productsInDB = [...productsInDB, ...(await productsPage.products)];
			page++;
		}
		console.log("Products in Database", productsInDB.length);
		const productsToAdd = products.filter((product) => !productsInDB.find((p) => p.link === product.link));

		console.log("Products to add", productsToAdd.length);
		console.log("Processing in 5 sec");
		await setTimeout(() => {}, 5000);
		for (const product of products) {
			await insertProduct(product);
		}
		console.log(`${products.length} products imported successfully!`);
	} catch (error) {
		console.error(`Error importing products: ${error}`);
	}
};

export { importProductsFromJson };
