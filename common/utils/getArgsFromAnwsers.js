import { tasks } from "./choicesDefinition.js";

export function getArgsFromAnswers(answers = { tasks: [], proxies: [], backends: {} }) {
	let argsTasks = {};
	const tasksAsPlaywright = tasks.filter((task) => task.backends && task.backends.includes("playwright")).length > 0;
	let argsTasksBackend = tasksAsPlaywright ? ["-b", "playwright"] : [];
	console.log("answers", answers.tasks);
	for (const task of [...answers.tasks]) {
		const taskObject = tasks.find((t) => t.value === task);
		if (taskObject) argsTasks[taskObject.for] = [...(argsTasks[taskObject.for] || ["-t"]), task];
		let backend = null;
		if (answers.backends) backend = Object.keys(answers.backends).find((key) => answers.backends[key].includes(task));
		if (argsTasksBackend.length === 0 && backend) argsTasksBackend = ["-b"];
		if (backend) argsTasksBackend = [...new Set([...argsTasksBackend, backend])];
	}

	const scrapyWillRun =
		(
			answers.tasks.filter((task) => tasks.find((taskObject) => taskObject.value === task)?.for?.includes("scrapy")) ||
			[]
		).length > 0;
	if (scrapyWillRun)
		argsTasks.scrapy = [
			...(argsTasks.scrapy || []),
			...(argsTasksBackend || []),
			"-s",
			answers.storage,
			"-p",
			...answers.proxies,
		];

	if (argsTasks.frontend) argsTasks.frontend = [...(argsTasks.frontend || []), "-s", answers.storage];
	if (argsTasksBackend.length > 0) argsTasks.backend = [...(argsTasks.backend || []), "-s", answers.storage];
	return argsTasks;
}
