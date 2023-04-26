import { DataList } from "../../components/DataList";
import "./css/normalizer.css";
import "./css/style.css";

import productsWithInfos from "../../../../common/data/productsWithInfos.json";
import { useEffect, useMemo, useState } from "react";

const pageSize = 50;

export function AnalyseProducts() {
	console.log("Analyse Render");
	const [ingredientsSelected, setIngredientsSelected] = useState([]);
	const [search, setSearch] = useState("");
	const [pageNumber, setPageNumber] = useState(1);
	const [sortByKcal, setSortByKcal] = useState(false);

  useEffect(()=>{
    console.log("Selecteds :" , ingredientsSelected)
  }, [ingredientsSelected])

	const productWords = useMemo(() => {
		let products = [];
		productsWithInfos.forEach((product) => (products = [...products, ...product.name.toLowerCase().split(" ")]));
		return [...new Set(products)];
	}, [productsWithInfos]);


	const productsAfterSearch = useMemo(() => {
		if (search.length < 2) return productsWithInfos;
		const searchTerms = search.toLowerCase().split(" ");
		let results = [];
		for (const product of productsWithInfos) {
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
	}, [search, productsWithInfos]);

	const productsAfterTags = useMemo(() => {
		const results = [];

		for (const product of productsAfterSearch) {
			let tagsFound = true;
			for (const selected of ingredientsSelected) {
        // Get all the worlds into a single string
        const productString = `${product.ingredients} ${product.name}` 
					if (!productString.toLowerCase().includes(selected.toLowerCase())) {
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
    console.log("Filter products");
		let productsCopy = [...productsAfterTags];
		return productsCopy.filter((product) => (product.nutricionalValues.kcal && product.perUnitPrice.pricePerUnit === "KG")).sort((a, b) => {
			const aKcalPerPrice = parseInt(a.nutricionalValues.kcal) * 10 / parseFloat(a.perUnitPrice.pricePer);
      const bKcalPerPrice = parseInt(b.nutricionalValues.kcal) * 10 / parseFloat(b.perUnitPrice.pricePer);
      return aKcalPerPrice - bKcalPerPrice;
		});
	}, [productsAfterTags, sortByKcal]);

	const productsAfterPagination = useMemo(() => {
    console.log("Pagination");
		return productsAfterSort.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
	}, [productsAfterSort, pageNumber]);

	const removeIngredientSelected = (value) => {
		setIngredientsSelected((selecteds) => selecteds.filter((selected) => selected !== value));
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
					.filter((ingredient) => !ingredient.includes("/"))
					.map((ingredient, i) => (
						<span className="tag ingredients" key={i} onClick={() => removeIngredientSelected(ingredient.trim())}>
							{ingredient.trim()}
						</span>
					))}
			</div>

			<DataList data={productWords} setSelecteds={setIngredientsSelected} selectedCallBack={() => true} />

			<section id="card-container">
				{productsAfterPagination.map((product, i) => (
					<div className="card" key={i}>
						<h2>
							{product.name} {product.price}€ {product.perUnitPrice.pricePer} / {product.perUnitPrice.pricePerUnit}
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
