import { tasks as tasksDef } from "./choicesDefinition.js";

export function getAnswersFromArgs() {
	const args = process.argv.slice(2);
	let answers = { tasks: [], proxies: [] };

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
			let proxies = [];
			while (args[i + 1] && !args[i + 1].startsWith("-")) {
				proxies.push(args[i + 1]);
				i++;
			}
			answers.proxies = proxies;
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
		}
	}
	console.log("answers.backends getargs", answers.backends);
	if (answers.backends)
		// Reformating backends for each task
		answers.backends = answers.backends
			.map((backend) => {
				const tasks = answers.tasks.filter((task) => {
					const taskObject = tasksDef.find((t) => t.value === task);
					if (!taskObject?.backends) return false;
					if (taskObject.backends.length === 1) return false;
					return taskObject.backends.includes(backend);
				});
				console.log("tasks", tasks);
				return { backend, tasks };
			})
			.reduce((acc, { backend, tasks }) => {
				return { ...acc, [backend]: [...(acc[backend] || []), ...tasks] };
			}, {});
	return answers;
}
