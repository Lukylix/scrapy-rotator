export function getEnvArgsFromAnwsers(answers) {
	const envArgs = [];
	if (answers?.tasks?.length) {
		envArgs.push("-e");
		envArgs.push(`TASKS=${answers.tasks.join(",")}`);
	}
	if (answers?.proxies?.length) {
		envArgs.push("-e");
		envArgs.push(`PROXIES=${answers.proxies.join(",")}`);
	}
	if (answers?.storage) {
		envArgs.push("-e");
		envArgs.push(`STORAGE=${answers.storage}`);
	}
	if (answers?.backends?.length) {
		envArgs.push("-e");
		envArgs.push(`BACKENDS=${answers.backends.join(",")}`);
	}
	if (answers?.playwrightInDocker) {
		envArgs.push("-e");
		envArgs.push(`PLAYWRITE_IN_DOCKER=${answers.playwrightInDocker}`);
	}
	return envArgs;
}
