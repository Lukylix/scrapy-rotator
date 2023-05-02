import axios from "axios";

const baseUrl = "http://localhost:3000/supermarket";

const waitForApi = async () => {
	try {
		let res = null;
		while (res?.data?.message !== "I'm ready!") {
			try {
				console.log("Waiting for api to be ready...");
				res = await axios.get(`http://localhost:3000/ready`);
				if (!res?.data?.message) await setTimeout(() => {}, 5000);
			} catch (error) {}
		}
		return true;
	} catch (error) {
		console.error(`Error checking if Elasticsearch is ready.`);
	}
};

const getSortProperties = async () => {
	try {
		const result = await axios.get(`${baseUrl}/sort-properties`);
		return result.data;
	} catch (error) {
		console.error(`Error getting sort properties`);
	}
};

const getFilterProperties = async () => {
	try {
		const result = await axios.get(`${baseUrl}/filter-properties`);
		return result.data;
	} catch (error) {
		console.error(`Error getting filter properties`);
	}
};

const insertProduct = async (product) => {
	try {
		const result = await axios.post(`${baseUrl}/product`, product);
		console.log(`Inserted product with id: ${result.data._id}`);
		return result.data;
	} catch (error) {
		console.error(`Error inserting product: ${product.name}`);
	}
};

const updateProduct = async (product) => {
	try {
		const result = await axios.put(`${baseUrl}/product`, product);
		console.log(`Updated product with id: ${result.data._id}`);
		return result.data;
	} catch (error) {
		console.error(`Error updating product: ${product.name}`);
	}
};

const getProducts = async (page, search = "", sorts = [], filters = []) => {
	try {
		const result = await axios.get(
			`${baseUrl}/products?page=${page}&search=${encodeURIComponent(search)}&sorts=${encodeURIComponent(
				JSON.stringify(sorts)
			)}&filters=${encodeURIComponent(JSON.stringify(filters))}`
		);
		return result.data;
	} catch (error) {
		console.error(`Error getting products`);
	}
};

const getProduct = async (link) => {
	try {
		const result = await axios.get(`${baseUrl}/product/${link}`);
		return result.data;
	} catch (error) {
		console.error(`Error getting product with link: ${link}`);
	}
};

export { getProducts, getFilterProperties, getSortProperties, waitForApi, getProduct, updateProduct, insertProduct };
