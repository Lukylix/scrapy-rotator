import inquirer from "inquirer";
import { tasks, proxies, storage } from "./choicesDefinition.js";

function getUniqueValues(arr) {
	const uniqueArr = [];
	arr.forEach((item) => {
		if (!uniqueArr.some((elem) => JSON.stringify(elem) === JSON.stringify(item))) {
			uniqueArr.push(item);
		}
	});
	return uniqueArr;
}

export async function askAnswers(answers = { tasks: [], proxies: [] }) {
	let willCrawl = false;

	if (!process.env.IS_DOCKER && answers.tasks.length < 1) {
		answers = {
			...answers,
			...(await inquirer.prompt([
				{
					type: "checkbox",
					name: "tasks",
					message: "Sélectionnez les tâches à exécuter :",
					choices: tasks,
				},
			])),
		};

		const backendsGroups = getUniqueValues(
			answers.tasks
				.filter((task) => {
					const taskObject = tasks.find((t) => t.value === task);
					if (!taskObject.backends) return false;
					willCrawl = true;
					if (taskObject.backends.length === 1) return false;
					return true;
				})
				.reduce((acc, task) => [...acc, tasks.find((t) => t.value === task).backends], [])
		);

		if (!process.env.IS_DOCKER && !answers.backends)
			for (const backendGroup of backendsGroups) {
				const tasksForBackend = answers.tasks
					.map((task) => tasks.find((t) => t.value === task))
					.filter((task) => task.backends && task.backends.every((backend) => backendGroup.includes(backend)));
				const tasksKeys = tasksForBackend.map((task) => task.value).join(", ");
				const { backend } = await inquirer.prompt([
					{
						type: "list",
						name: "backend",
						message: `Sélectionnez le backend à utiliser pour (${tasksKeys}):`,
						choices: backendGroup.map((backend) => ({ name: backend, value: backend })),
					},
				]);
				answers.backends = { ...answers.backends, [backend]: tasksForBackend.map((task) => task.value) };
			}
		const playwrightTasks = answers.tasks.filter((task) =>
			tasks.find((t) => t.value === task).backends.includes("playwright")
		);
		if (playwrightTasks.length > 0) {
			answers = {
				...answers,
				...(await inquirer.prompt([
					{
						type: "list",
						name: "playwrightInDocker",
						message: "Voulez-vous exécuter Playwright dans un conteneur Docker ?",
						choices: [
							{ name: "Oui", value: true },
							{ name: "Non", value: false },
						],
					},
				])),
			};

			if (willCrawl && !process.env.IS_DOCKER && answers.proxies.length < 1) {
				console.log("willCrawl");
				answers = {
					...answers,
					...(await inquirer.prompt([
						{
							type: "checkbox",
							name: "proxies",
							message: "Sélectionnez les proxies à utiliser :",
							choices: proxies,
						},
					])),
				};
			}

			if (!process.env.IS_DOCKER && !answers.storage)
				answers = {
					...answers,
					...(await inquirer.prompt([
						{
							type: "list",
							name: "storage",
							message: "Sélectionnez le type de stockage :",
							choices: storage,
						},
					])),
				};
		}
		return answers;
	}
}
