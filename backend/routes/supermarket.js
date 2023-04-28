import express from "express";
import {
	getProducts,
	insertProduct,
	updateProduct,
	getProduct,
	deleteProduct,
	getSortProperties,
	getFilterProperties,
} from "../models/products.js";
let router = express.Router();

router.get("/sort-properties", async (req, res, next) => {
	const sortProperties = await getSortProperties();
	if (sortProperties) return res.status(200).json(sortProperties);
	res.status(404).json({ message: "Sort properties not found" });
});

router.get("/filter-properties", async (req, res, next) => {
	const filterProperties = await getFilterProperties();
	if (filterProperties) return res.status(200).json(filterProperties);
	res.status(404).json({ message: "Filter properties not found" });
});

router.get("/products", async (req, res, next) => {
	const { page, pageSize, filters, search, sorts } = req.query;
	const products = await getProducts(page || 1, pageSize || 49, filters || [], search, sorts);
	if (products) return res.status(200).json(products);
	res.status(404).json({ message: "Products not found" });
});

router.get("/products/:link", async (req, res, next) => {
	const product = await getProduct(req.params.link);
	if (product) return res.status(200).json(product);
	res.status(404).json({ message: "Product not found" });
});

router.post("/product", async (req, res, next) => {
	const product = await insertProduct(req.body);
	if (product) return res.status(200).json(product);
	res.status(404).json({ message: "Product not created" });
});

router.put("/product", async (req, res, next) => {
	const product = await updateProduct(req.body);
	if (product) return res.status(200).json(product);
	res.status(404).json({ message: "Product not updated" });
});

router.delete("/product/:id", async (req, res, next) => {
	const product = await deleteProduct(req.params.id);
	if (product) return res.status(200).json(product);
	res.status(404).json({ message: "Product not deleted" });
});

export default router;
