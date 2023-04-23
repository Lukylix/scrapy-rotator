import { DataList } from "../../../components/DataList/DataList";
import "./css/normalizer.css";
import "./css/style.css";

import productsWithInfos from "../../../../data/productsWithInfos.json";
import { useMemo, useState } from "react";

const pageSize = 50;

export function AnalyseProducts() {
	console.log("Analyse Render");
	const [ingredientsSelected, setIngredientSelected] = useState([]);
	const [search, setSearch] = useState("");
	const [pageNumber, setPageNumber] = useState(1);
	const [sortByKcal, setSortByKcal] = useState(false);
	const productWords = useMemo(() => {
		let products = [];
		productsWithInfos.forEach((product) => (products = [...products, ...product.name.split(" ")]));
		return [...new Set(products)];
	}, [productsWithInfos]);

	const produitWithValues = useMemo(() => {
		return productsWithInfos.map((product) => {
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
			return { ...product, nutricionalValues: nutricionalValuesObject };
		});
	}, [productsWithInfos]);

	const productsAfterSearch = useMemo(() => {
		if (search.length < 2) return produitWithValues;
		const searchTerms = search.toLowerCase().split(" ");
		let results = [];
		for (const product of produitWithValues) {
			let areWorldsFound = true;
			for (const searchTerm of searchTerms) {
				// If a search term is not found in the recipe name or description
				if (!product.name.toLowerCase().includes(searchTerm)) {
					// If the search term is also not found in the ingredients
					if (product.ingredients)
						if (!product.ingredients.toLowerCase().includes(searchTerm)) {
							// The recipe is not added to the results
							areWorldsFound = false;
							// Stop checking the current recipe
							break;
						}
				}
			}
			if (areWorldsFound) results.push(product);
		}
		// If all search terms are found in the recipe, add it to the results array

		return results;
	}, [search]);

	const productsAfterTags = useMemo(() => {
		const results = [];

		for (const product of productsAfterSearch) {
			let tagsFound = true;
			// Get all the ingredients from the recipe into a single string
			for (const selected of ingredientsSelected) {
				if (product.ingredients)
					if (!product.ingredients.toLowerCase().includes(selected.toLowerCase())) {
						// The recipe is not added to the results
						tagsFound = false;
						// Stop checking the current tag and then the recipe
						break;
					}
			}
			// If the selected tags of type ingredient aren't found in the recipe ingredients, stop checking the current recipe
			if (tagsFound) results.push(product);
		}

		return results;
	}, [productsAfterSearch, ingredientsSelected]);
	const productsAfterSort = useMemo(() => {
		if (!sortByKcal) return productsAfterTags;
		let productsCopy = [...productsAfterTags];
		productsCopy.sort((a, b) => {
			const regex = /^(\d+)\s*(\w+)\D+(\d+\.\d+)\s*€\s*\/\s*(\w+)/g;
			const aPerUnitPriceMatches = regex.exec(a.perUnitPrice);
			const bPerUnitPriceMatches = regex.exec(b.perUnitPrice);

			if (!aPerUnitPriceMatches) return 0;
			if (!bPerUnitPriceMatches) return 0;
			console.log({ aPerUnitPriceMatches, bPerUnitPriceMatches });
			const [, aQuantity, aUnit, aPrice, aPriceUnit] = aPerUnitPriceMatches;
			const [, bQuantity, bUnit, bPrice, bPriceUnit] = bPerUnitPriceMatches;
			if (aPriceUnit !== "KG") return 0;
			if (bPriceUnit !== "KG") return 0;
			if (!a.nutricionalValues.kcal) return 0;
			if (!b.nutricionalValues.kcal) return 0;
			const aKcalPerkilos = (a.nutricionalValues.kcal * 100) / parseFloat(aPrice);
			const bKcalPerkilos = (b.nutricionalValues.kcal * 100) / parseFloat(bPrice);
			return bKcalPerkilos - aKcalPerkilos;
		});
		return productsCopy;
	}, [productsAfterTags, sortByKcal]);
	const productsAfterPagination = useMemo(() => {
		return productsAfterSort.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
	}, [productsAfterSort, pageNumber]);

	const removeIngredientSelected = (value) => {
		setIngredientSelected((selecteds) => selecteds.filter((selected) => selected !== value));
	};
	return (
		<main>
			<label className="research-bar">
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					type="text"
					name="search"
					placeholder="Rechercher une recette"
				/>
				<i className="fas fa-search"></i>
			</label>

			<button onClick={() => setSortByKcal((sortByKcal) => !sortByKcal)}>Sort by kcal</button>
			<div className="tags">
				{ingredientsSelected
					.filter((ingredient) => ingredient.includes("/"))
					.map((ingredient, i) => (
						<span className="tag ingredients" key={i} onClick={() => removeIngredientSelected(ingredient.trim())}>
							{ingredient.trim()}
						</span>
					))}
			</div>

			<DataList data={productWords} setSelecteds={setIngredientSelected} selectedCallBack={() => true} />

			<section id="card-container">
				{productsAfterPagination.map((product, i) => (
					<div className="card" key={i}>
						<h2>
							{product.name} {product.price}€ {product.perUnitPrice}
						</h2>
						{/* {product.ingredients ? (
							<ul>
								{product.ingredients
									.split(" ")
									.filter((value) => value.trim() !== "")
									.map((ingredient, i) => (
										<li key={i}>{ingredient}</li>
									))}
							</ul>
						) : (
							<></>
						)} */}

						<ul>
							{Object.keys(product.nutricionalValues).map((key, i) => {
								const value = product.nutricionalValues[key];
								return (
									<li key={i}>
										{value.value} {value.unit}
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</section>
			<button onClick={() => setPageNumber(pageNumber - 1)}>Previous page</button>
			<button onClick={() => setPageNumber(pageNumber + 1)}>Next Page</button>
		</main>
	);
}
