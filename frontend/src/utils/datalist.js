class dataList {
	constructor(containerSelector, data, selectedCallBack = () => {}) {
		this.data = data;
		this.selectedCallBack = selectedCallBack;
		this.parentContainer = document.querySelector(containerSelector).parentNode;
		this.container = document.querySelector(containerSelector);
		this.input = document.querySelector(containerSelector + " input[list]");
		this.dataList = document.querySelector(containerSelector + " + datalist");
		this.options = this.dataList.querySelectorAll("option");
		this.selected = [];
		this._setDataList();
		this._addEventListeners();
		this._setParentWidth();
	}
	set dataOptions(data) {
		this.data = data;
		this._setDataList();
		this._setParentWidth();
		this._addEventListenersOptions();
	}

	removeSelected(value) {
		this.selected = this.selected.filter((item) => item !== value);
		this.selectedCallBack();
	}

	// Create the datalist with its options
	_setDataList() {
		this.dataList.innerHTML = "";
		this.data.forEach((item) => {
			let option = document.createElement("option");
			option.value = item;
			option.textContent = item;
			this.dataList.appendChild(option);
		});
		this.options = this.dataList.querySelectorAll("option");
	}

	// Set the width of the parent container depending to the number of options
	_setParentWidth() {
		this.parentContainer.classList.remove("w30");
		this.parentContainer.classList.remove("w20");
		if (this.data.length > 20) {
			this.parentContainer.classList.add("w30");
			return;
		}
		if (this.data.length > 10) {
			this.parentContainer.classList.add("w20");
			return;
		}
	}

	// Perform an option selection on click
	_addEventListenersOptions() {
		this.options.forEach((option) => {
			option.addEventListener("click", () => {
				// Unique selection value
				this.selected = [...new Set([...this.selected, option.value])];
				this.selectedCallBack();
			});
		});
	}

	_addEventListeners() {
		// When input is focused, show the datalist
		this.input.addEventListener("focus", () => {
			this.dataList.style.display = "grid";
			this.parentContainer.classList.add("active");
		});
		// When input is blurred, hide the datalist
		this.input.addEventListener("blur", () => {
			// Let the time for the option to be selected before hiding the list
			setTimeout(() => {
				this.dataList.style.display = "none";
				this.parentContainer.classList.remove("active");
			}, 100);
		});
		// When input value is changed, filter the options
		this.input.addEventListener("input", () => {
			this.options.forEach((option) => {
				// If the option contains the input value, show it
				if (option.value.toLowerCase().includes(this.input.value.toLowerCase())) option.style.display = "block";
				else option.style.display = "none";
			});
		});
		this._addEventListenersOptions();
	}
}

//new dataList("#ingrédient-container", ["Pomme", "Poire", "Cerise", "Pattate"]);
