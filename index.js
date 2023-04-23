import cpuListCrawlee from "./crawlers/crawlee/cpuBenchmark.js";
import cpuPricesCrawlee from "./crawlers/crawlee/cpuPrices.js";
import productPlaywright from "./crawlers/playwright/products.js";
import getProductsInfo from "./crawlers/playwright/productsWithInfo.js";
import cpuListAxios from "./crawlers/axios/cpuBenchmark.js";
import cpuPricesAxios from "./crawlers/axios/cpuPrices.js";
import { retriveCPUs } from "./analyse/cpuFilter.js";
import { getFreeProxies, getPremiumProxies, getAllProxies } from "./utils/proxiesAgregator.js";
import inquirer from "inquirer";
import { retriveRequests } from "./analyse/urls.js";

const backends = [{ name: "crawlee" }, { name: "axios" }, { name: "playwright" }];

const taches = [
	{ name: "Recuperer le score des proceseurs", checked: false, backends: ["crawlee", "axios"] },
	{ name: "Récuperer le prix des processeurs", checked: false, backends: ["crawlee", "axios"] },
	{ name: "Filtrer les processeurs", checked: false },
	{ name: "Récuperer les produits du supermarché", checked: false, backends: ["playwright"] },
	{ name: "Récuperer les infos produits", checked: false, backends: ["playwright"] },
	{ name: "Récuperer les requetes", checked: false },
];

const proxies = [
	{ name: "Premium", checked: true },
	{ name: "Free", checked: false },
];
let answers = { taches: [], proxies: [] };
if (!process.env.IS_DOCKER)
	answers = await inquirer.prompt([
		{
			type: "checkbox",
			name: "taches",
			message: "Sélectionnez les tâches à exécuter :",
			choices: taches,
		},
	]);

if (process.env.TASK === "cpu-benchmark") {
	answers.taches.push("Recuperer le score des proceseurs");
} else if (process.env.TASK === "cpu-prices") {
	answers.taches.push("Récuperer le prix des processeurs");
} else if (process.env.TASK === "products-supermarket") {
	answers.taches.push("Récuperer les produits du supermarché");
} else if (process.env.TASK === "requests") {
	answers.taches.push("Récuperer les requetes");
} else if (process.env.TASK === "products-infos") {
	answers.taches.push("Récuperer les infos produits");
}

const willCrawl = answers.taches.some((tache) => tache !== "Filtrer les processeurs");

const backendsForTasks = [
	...new Set(
		answers.taches.reduce(
			(backendsSlected, tache) => (tache.backends ? [...backendsSlected, backends] : backendsSlected),
			[]
		)
	),
].map((backend) => ({ name: backend }));

let prompt = [];
if (backendsForTasks.length > 1)
	prompt.push({
		type: "list",
		name: "backend",
		message: "Sélectionnez le backend :",
		choices: backendsForTasks,
	});
prompt.push({
	type: "checkbox",
	name: "proxies",
	message: "Sélectionnez les proxies a utilisé :",
	choices: proxies,
});
if (willCrawl && !process.env.IS_DOCKER) {
	const answerCrawll = await inquirer.prompt(prompt);
	answers = { ...answers, ...answerCrawll };
}

if (process.env.BACKEND === "crawlee") {
	answers.backend = "crawlee";
} else if (process.env.BACKEND === "axios") {
	answers.backend = "axios";
} else if (process.env.BACKEND === "playwright") {
	answers.backend = "playwright";
}
if (process.env.PROXIES === "free") {
	answers.proxies.push("Free");
} else if (process.env.PROXIES === "premium") {
	answers.proxies.push("Premium");
}
async function onPromptExit() {
	let proxies = [];
	if (answers.proxies) {
		if (answers?.proxies?.length === proxies.length) {
			console.log("All proxies");
			proxies = await getAllProxies();
		} else {
			for (const proxy of answers?.proxies) {
				if (proxy === "Premium") proxies = await getPremiumProxies();
				if (proxy === "Free") proxies = await getFreeProxies();
			}
		}
	}

	if (answers.taches)
		for (const tache of answers?.taches) {
			if (tache === "Recuperer le score des proceseurs") {
				if (answers.backend === "crawlee") await cpuListCrawlee(proxies);
				if (answers.backend === "axios") await cpuListAxios(proxies);
			}
			if (tache === "Récuperer le prix des processeurs") {
				if (answers.backend === "crawlee") await cpuPricesCrawlee(proxies);
				if (answers.backend === "axios") await cpuPricesAxios(proxies);
			}
			if (tache === "Filtrer les processeurs") {
				const answers = await inquirer.prompt([
					{
						type: "input",
						name: "name",
						message: "Nom du processeur :",
					},
					{
						type: "input",
						name: "minCores",
						message: "Nombre minimal de coeurs :",
						validate: (input) => {
							const value = parseInt(input);
							return !isNaN(value) || "Veuillez entrer un nombre valide.";
						},
					},
				]);
				await retriveCPUs({ name: answers.name, minCores: parseInt(answers.minCores) });
			}
			if (tache === "Récuperer les produits du supermarché") {
				await productPlaywright(proxies);
			}
			if (tache === "Récuperer les infos produits") {
				await getProductsInfo(proxies);
			}
			if (tache === "Récuperer les requetes") {
				await retriveRequests();
			}
		}
}

await onPromptExit();
