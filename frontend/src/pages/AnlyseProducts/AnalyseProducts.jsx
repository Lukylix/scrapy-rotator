import { DataList } from "../../components/DataList";
import "./css/normalizer.css";
import "./css/style.css";

import { useEffect, useState } from "react";
import { waitForApi, getProducts, getSortProperties, getFilterProperties } from "../../../../common/utils/api.js";
import Select from "react-select";

const operatorsDics = {
	eq: "=",
	ne: "!=",
	gt: ">",
	gte: ">=",
	lt: "<",
	lte: "<=",
};

export function AnalyseProducts() {
	const [productsWithInfos, setProductsWithInfos] = useState([]);
	const [ingredientsSelected, setIngredientsSelected] = useState([]);
	const [sortProperties, setSortProperties] = useState([]);
	const [slectedSortProperties, setSelectedSortProperties] = useState([]);
	const [filterValue, setFilterValue] = useState("");
	const [filterTypes, setFilterTypes] = useState([]);
	const [selectedFilterType, setSelectedFilterType] = useState("");
	const [filterProperties, setFilterProperties] = useState([]);
	const [selectedFilterProperty, setSelectedFilterProperty] = useState("");
	const [selectedFilters, setSelectedFilters] = useState([]);
	const [operators, setOperators] = useState([]);
	const [selectedOperator, setSelectedOperator] = useState("");
	const [search, setSearch] = useState("");
	const [pageNumber, setPageNumber] = useState(1);
	const [apiReady, setApiReady] = useState(false);

	useEffect(() => {
		console.log("filterType", selectedFilterType);
	}, [selectedFilterType]);

	useEffect(() => {
		(async () => {
			await waitForApi();
			setApiReady(true);
			console.log("api ready");
		})();
	}, []);

	useEffect(() => {
		(async () => {
			setSortProperties(await getSortProperties());
			const filterPropertiesRes = await getFilterProperties();
			setFilterProperties(filterPropertiesRes.keys);
			setFilterTypes(filterPropertiesRes.types);
			setOperators(filterPropertiesRes.operationsRange);
		})();
	}, []);

	useEffect(() => {
		(async () => {
			if (!apiReady) return;
			console.log("Fetching products..");
			const productsPage = await getProducts(pageNumber, search, slectedSortProperties, selectedFilters);
			const products = productsPage?.products;
			if (products) setProductsWithInfos(products);
			console.log(products);
		})();
	}, [ingredientsSelected, apiReady, pageNumber, search, slectedSortProperties, selectedFilters]);

	const removeIngredientSelected = (value) => {
		setIngredientsSelected((selecteds) => selecteds.filter((selected) => selected !== value));
	};

	const removeSelectedSortProperty = (value) => {
		setSelectedSortProperties((selecteds) => selecteds.filter((selected) => selected !== value));
	};

	const removeFilter = (value) => {
		setSelectedFilters((selecteds) => selecteds.filter((selected) => selected.property !== value));
	};

	const addFilter = () => {
		console.log("Selected Operator", selectedOperator);
		setSelectedFilters((selecteds) => [
			...selecteds,
			{
				property: selectedFilterProperty,
				type: selectedFilterType,
				operator: selectedFilterType == "range" ? selectedOperator : undefined,
				value: filterValue,
			},
		]);
	};

	return (
		<main>
			{!apiReady ? (
				<h1>Api is getting ready...</h1>
			) : (
				<>
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

					<h4>Sort</h4>
					<div className="tags">
						{slectedSortProperties.map((sortProperty, i) => (
							<span className="tag sort" key={i} onClick={() => removeSelectedSortProperty(sortProperty.trim())}>
								{sortProperty.trim()}
							</span>
						))}
					</div>
					<h4>Filters</h4>
					<div className="tags">
						{selectedFilters.map((filterProperty, i) => (
							<span
								className="tag filter"
								key={i}
								onClick={() => {
									removeFilter(filterProperty.property);
								}}
							>
								{filterProperty.property.trim()} {filterProperty.type.trim()} {filterTypes[filterProperty.type]}{" "}
								{filterProperty.operator && operatorsDics[filterProperty.operator]} {filterProperty.value.trim()}
							</span>
						))}
					</div>

					{/* <DataList data={productWords} setSelecteds={setIngredientsSelected} selectedCallBack={() => true} /> */}
					<DataList
						name="sort"
						placeholder="Sort by..."
						data={sortProperties}
						setSelecteds={setSelectedSortProperties}
					/>
					<div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
						<Select
							className="react-select-container"
							classNamePrefix="react-select"
							unstyled
							placeholder="Filter by..."
							data={filterProperties}
							onChange={(val) => setSelectedFilterProperty(val.value)}
							options={filterProperties.map((val) => ({ label: val, value: val }))}
						/>
						<Select
							className="react-select-container"
							classNamePrefix="react-select"
							unstyled
							placeholder="Filter type"
							onChange={(val) => setSelectedFilterType(val.value)}
							options={filterTypes.map((val) => ({ label: val, value: val }))}
						/>
						{selectedFilterType == "range" ? (
							<Select
								className="react-select-container"
								classNamePrefix="react-select"
								unstyled
								placeholder="Operator"
								onChange={(val) => setSelectedOperator(val.value)}
								options={operators.map((val) => ({ label: operatorsDics[val], value: val }))}
							/>
						) : null}
						<input type="text" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />
						<button onClick={addFilter}>Add filter</button>
					</div>

					<section id="card-container">
						{productsWithInfos.map((product, i) => (
							<div className="card" key={i}>
								<figure>
									<img src={(product?.images || product.image).replace(/\/p_\d+x\d+/, "")} />
									{product.nutricionalScore && (
										<img
											src={`https://${new URL(product.image || product.images).hostname.replace(
												"media.",
												""
											)}/images/badges/flag-nutriscore-${product.nutricionalScore}.svg`}
											style={{
												position: "absolute",
												bottom: 0,
												left: 0,
												width: "30%",
												height: "20%",
												objectFit: "contain",
											}}
										/>
									)}
								</figure>
								<figcaption>
									{product.name} {product.price}€ {product.perUnitPrice.pricePer} / {product.perUnitPrice.pricePerUnit}
									<p>{product.description}</p>
									{/* <ul>
							{Object.keys(product.nutricionalValues).map((key, i) => {
								const value = product.nutricionalValues[key];
								return (
									<li key={i}>
										{value.value} {value.unit}
									</li>
								);
							})}
						</ul> */}
								</figcaption>
							</div>
						))}
					</section>
					<button onClick={() => setPageNumber(pageNumber - 1)}>Previous page</button>
					<button onClick={() => setPageNumber(pageNumber + 1)}>Next Page</button>
				</>
			)}
		</main>
	);
}
