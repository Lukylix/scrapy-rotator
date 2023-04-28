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
		products = products.map((product) => ({
			...product,
			pricePerQuantityPerKcal:
				parseInt(product?.nutricionalValues?.kcal?.value * 100) / parseFloat(product?.perUnitPrice?.pricePer) ||
				undefined,
		}));
		while (page <= totalPages) {
			const productsPage = await getProducts(page);
			totalPages = productsPage.totalPages;
			productsInDB = [...productsInDB, ...(await productsPage.products)];
			page++;
		}
		console.log("Products in Database", productsInDB.length);
		const productsToAdd = products.filter((product) => !productsInDB.find((p) => p.link === product.link));

		console.log("Products to add", productsToAdd.length);
		console.log("Processing in 5sev");
		await setTimeout(() => {}, 5000);
		for (const product of productsToAdd) {
			await insertProduct(product);
		}
		console.log("Products imported successfully!");
	} catch (error) {
		console.error(`Error importing products: ${error}`);
	}
};

export { importProductsFromJson };
