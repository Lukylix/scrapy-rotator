import { useEffect, useRef, useState } from "react";

import "./datalist.css";

export function DataList({ data = [], setSelecteds = () => {}, selectedCallBack = () => {} }) {
	console.log("Datalist Render");
	const [inputValue, setInputValue] = useState("");
	const [active, setActive] = useState(false);
	const datalistRef = useRef();

	useEffect(() => {
		datalistRef.current.style.display = "none";
	}, []);

	const addSelected = (value) => {
    console.log("Add Seelected", value)
		setSelecteds((selecteds) => {
			return [...new Set([value, ...selecteds])];
		});
	};
	const onClick = (value) => {
    console.log("On Click")
		addSelected(value);
		selectedCallBack();
	};
	return (
		<div
			className={`dropdown-container ${data.length > 20 && "w30"} ${data.length > 10 && "w20"} ${active && "active"}`}
		>
			<div id="ingrédient-container" className="input-container">
				<input
					onFocus={() => {
						datalistRef.current.style.display = "grid";
						setActive(true);
					}}
					onBlur={() => {
						setTimeout(() => {
							datalistRef.current.style.display = "none";
							setActive(false);
						}, 300);
					}}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					autoComplete="off"
					list=""
					name="ingrédient"
					id="ingrédient"
					placeholder="Ingredients"
				/>
			</div>
			<div className="datalist" ref={datalistRef}>
				{data.map((item, i) => (
					<option
						key={i}
						onClick={(e) => onClick(e.target.value)}
						style={{ display: item.toLowerCase().includes(inputValue.toLowerCase()) ? "block" : "none" }}
					>
						{item}
					</option>
				))}
			</div>
		</div>
	);
}
