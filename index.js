import cpuListCrawlee from "./crawlers/crawlee/cpuBenchmarkCrawlee.js";
import cpuPricesCrawlee from "./crawlers/crawlee/cpuPricesCrawlee.js";
import cpuListAxios from "./crawlers/axios/cpuBenchmark.js";
import cpuPricesAxios from "./crawlers/axios/cpuPrices.js";
import { retriveCPUs } from "./analyse/cpuFilter.js";
import { getFreeProxies, getPremiumProxies, getAllProxies } from "./utils/proxiesAgregator.js";
import inquirer from "inquirer";

const backends = [{ name: "crawlee" }, { name: "axios" }];

const taches = [
	{ name: "Recuperer le score des proceseurs", checked: false },
	{ name: "Récuperer le prix des processeurs", checked: false },
	{ name: "Filtrer les processeurs", checked: true },
];

const proxies = [
	{ name: "Premium", checked: true },
	{ name: "Free", checked: false },
];

let answers = await inquirer.prompt([
	{
		type: "checkbox",
		name: "taches",
		message: "Sélectionnez les tâches à exécuter :",
		choices: taches,
	},
]);
const willCrawl = answers.taches.some((tache) => tache !== "Filtrer les processeurs");
if (willCrawl) {
	const answerCrawll = await inquirer.prompt([
		{
			type: "list",
			name: "backend",
			message: "Sélectionnez le backend :",
			choices: backends,
		},
		{
			type: "checkbox",
			name: "proxies",
			message: "Sélectionnez les proxies a utilisé :",
			choices: proxies,
		},
	]);
	answers = { ...answers, ...answerCrawll };
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
		}
}

await onPromptExit();
