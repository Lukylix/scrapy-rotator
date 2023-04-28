import { getAnswersFromEnv } from "../common/utils/getAnswersFromEnv.js";
import { getAnswersFromArgs, choicesDefinition } from "../common/utils/index.js";

let proxies = [];

let answers = getAnswersFromEnv();
answers = { ...answers, ...getAnswersFromArgs(answers) };

if (answers.proxies && answers.proxies.length > 0) {
	for (const proxy of answers.proxies) {
		const proxyObject = choicesDefinition.proxies.find((p) => p.value === proxy);
		console.log("proxyObject", proxyObject);
		proxies = [...proxies, ...(await proxyObject.get())];
	}
}
for (const task of answers.tasks) {
	let taskObject = choicesDefinition.tasks.find((t) => t.value === task);
	if (!taskObject) continue;
	if (taskObject.backends) {
		if (taskObject?.backends.length > 1) {
			taskObject.backend = Object.keys(answers.backends).find((key) => answers.backends[key].includes(task));
		} else {
			taskObject.backend = taskObject.backends[0];
		}
		await taskObject.get[taskObject.backend](proxies);
	} else {
		await taskObject.do();
	}
}
