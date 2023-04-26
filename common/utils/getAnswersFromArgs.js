import { tasks as tasksDef } from "./choicesDefinition.js";

export function getAnswersFromArgs(answers = { tasks: [], proxies: [] }) {
	const args = process.argv.slice(2);
	for (let i = 0; i < args.length; i++) {
		if (args[i] === "-t") {
			// Tasks
			let tasks = [];
			while (args[i + 1] && !args[i + 1].startsWith("-")) {
				tasks.push(args[i + 1]);
				i++;
			}
			answers.tasks = tasks;
		} else if (args[i] === "-p") {
			// Proxies
			while (args[i + 1] && !args[i + 1].startsWith("-")) {
				answers.proxies.push(args[i + 1]);
				i++;
			}
		} else if (args[i] === "-s") {
			// Storage
			answers.storage = args[i + 1];
			i++;
		} else if (args[i] === "-b") {
			// Backends
			let backends = [];
			while (args[i + 1] && !args[i + 1].startsWith("-")) {
				backends.push(args[i + 1]);
				i++;
			}
			answers.backends = backends;
		} else if (args[i] === "-d") {
			// Docker
			answers.playwrightInDocker = true;
		}
	}
	if (answers.backends && answers.backends.length > 0)
		// Reformating backends for each task
		answers.backends = answers.backends
			.map((backend) => {
				const tasks = answers.tasks.filter((task) => {
					const taskObject = tasksDef.find((t) => t.value === task);
					if (!taskObject?.backends) return false;
					if (taskObject.backends.length === 1) return false;
					return taskObject.backends.includes(backend);
				});
				return { backend, tasks };
			})
			.reduce((acc, { backend, tasks }) => {
				return { ...acc, [backend]: [...(acc[backend] || []), ...tasks] };
			}, {});

	return answers;
}
