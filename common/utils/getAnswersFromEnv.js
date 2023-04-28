import { tasks, tasks as tasksDef } from "./choicesDefinition.js";
import dotenv from "dotenv";

dotenv.config();

export function getAnswersFromEnv() {
	let answers = { tasks: [], proxies: [] };
	if (process.env.TASKS)
		answers.tasks = (process.env.TASKS || "").includes(",") ? process.env.TASKS.split(",") : [process.env.TASKS];
	if (process.env.PROXIES)
		answers.proxies = (process.env.PROXIES || "").includes(",")
			? process.env.PROXIES.split(",")
			: [process.env.PROXIES];
	if (process.env.STORAGE) answers.storage = process.env.STORAGE;
	if (answers.tasks.length > 0 || process.env.BACKENDS)
		answers.backends = [
			...new Set(
				...answers.tasks
					.map((task) => tasksDef.find((taskObject) => taskObject.value === task))
					.filter((taskObject) => taskObject?.backends)
					.reduce((acc, { backends }) => [new Set([...acc, ...backends])], []),
				...((process.env.BACKENDS || "").includes(",") ? process.env.BACKENDS.split(",") : [process.env.BACKENDS])
			),
		];
	if (process.env.PLAYWRITE_IN_DOCKER) answers.playwrightInDocker = process.env.PLAYWRITE_IN_DOCKER;

	if (answers?.tasks?.length < 1) delete answers.tasks;
	return answers;
}
