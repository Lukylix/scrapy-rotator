import { tasks } from "./choicesDefinition.js";

export function getArgsFromAnswers(answers = { tasks: [], proxies: [], backends: {} }) {
	let argsTasks = {};
	let argsTasksBackend = ["-b", "playwright"];
	for (const task of [...answers.tasks]) {
		const taskObject = tasks.find((t) => t.value === task);
		if (taskObject && taskObject.for !== task)
			argsTasks[taskObject.for] = [...(argsTasks[taskObject.for] || ["-t"]), task];
		let backend = null;
		if (answers.backends) backend = Object.keys(answers.backends).find((key) => answers.backends[key].includes(task));
		if (backend) argsTasksBackend = [...new Set([...argsTasksBackend, backend])];
	}

	argsTasks.scrapy = [
		...(argsTasks.scrapy || []),
		...(argsTasksBackend || []),
		"-s",
		answers.storage,
		"-p",
		...answers.proxies,
	];

	argsTasks.backend = [...(argsTasks.backend || []), "-s", answers.storage];
	return argsTasks;
}
