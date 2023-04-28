import { DataList } from "../../components/DataList";
import "./css/normalizer.css";
import "./css/style.css";

import { useEffect, useState } from "react";
import { waitForApi, getProducts, getSortProperties, getFilterProperties } from "../../../../common/utils/api.js";
import Select from "react-select";
import Pagination from "../../components/Pagination/Pagination";
import { ReactComponent as Visibility } from "../../assets/visibility.svg";

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
	const [totalPages, setTotalPages] = useState(1);
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
			setTotalPages(productsPage?.totalPages);
			if (products) setProductsWithInfos(products);
		})();
	}, [apiReady, pageNumber, search, slectedSortProperties, selectedFilters]);

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
					{slectedSortProperties.length > 0 && <h3>Sort</h3>}
					<div className="tags">
						{slectedSortProperties.map((sortProperty, i) => (
							<span className="tag sort" key={i} onClick={() => removeSelectedSortProperty(sortProperty.trim())}>
								{sortProperty.trim()}
							</span>
						))}
					</div>
					Visibility {selectedFilters.length > 0 && <h3>Filters</h3>}
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
					<Pagination page={pageNumber} totalPage={totalPages} setPage={setPageNumber} />
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
									<div className="prices">
										<span className="price">{product.price}€</span>
										{product?.perUnitPrice?.pricePer && product?.perUnitPrice?.pricePerUnit && (
											<span className="price-per-unit">
												{product?.perUnitPrice?.pricePer}€ / {product?.perUnitPrice?.pricePerUnit}
											</span>
										)}
									</div>
								</figure>
								<figcaption>
									{product.name}
									<p>{product.description}</p>
									<a
										href={`https://${new URL(product.image || product.images).hostname.replace("media.", "")}${
											product.link
										}`}
										className="view-button"
									>
										<Visibility fill="white" />
									</a>
								</figcaption>
							</div>
						))}
					</section>
					<Pagination page={pageNumber} totalPage={totalPages} setPage={setPageNumber} />
				</>
			)}
		</main>
	);
}
