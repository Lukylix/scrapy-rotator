import { spawn } from "child_process";
import { askAnswers, getAnswersFromArgs, getArgsFromAnswers } from "./common/utils/index.js";
import dotenv from "dotenv";
import { getAnswersFromEnv } from "./common/utils/getAnswersFromEnv.js";
import { getEnvArgsFromAnwsers } from "./common/utils/getEnvArgsFromAnswer.js";

dotenv.config();

const noLogsFor = ["elasticsearch"];

async function startChildProcess(command, args, name = "") {
	let child;
	child = spawn(command, args, { env: process.env });

	child.on("exit", (code, signal) => {
		console.log(`Child process exited with code ${code} and signal ${signal}.`);

		// Restart the child process only if it crashed
		if (code !== 0) {
			setTimeout(() => {
				console.log("Restarting child process...");
				startChildProcess(command, args, name);
			}, 2000);
		}
	});

	child.on("error", (err) => {
		console.error(`Error in child process ${name}: ${err.message}`);
	});
	if (!noLogsFor.includes(name.toLowerCase()))
		child.stdout.on("data", (data) => {
			console.log(`${name ? `${name} :` : ""}${data.toString()}`);
		});

	child.stderr.on("data", (data) => {
		console.error(`${name} error: ${data.toString().replace(/\n/gm, "")}`);
	});
	// Forward SIGINT signal to child process
	process.on("SIGINT", () => {
		console.log(`Received SIGINT signal. Killing child process ${name}...`);
		child.kill("SIGINT");
		process.exit();
	});
}

let answers = getAnswersFromEnv();
answers = { ...answers, ...getAnswersFromArgs(answers) };

// Ask for for missing answers
answers = await askAnswers(answers);

const argsTasks = getArgsFromAnswers(answers);
if (process.env.IS_DOCKER) console.log("Running in docker runing sub containers is not implemented yet");
if (argsTasks.elasticsearch && !process.env.IS_DOCKER)
	startChildProcess("docker", ["compose", "-f", "./elasticsearch/docker-compose.yml", "up"], "Elasticsearch");
if ((argsTasks.scrapy && !answers?.playwrightInDocker) || (argsTasks.scrapy && process.env.IS_DOCKER))
	startChildProcess(
		"node",
		["./scrapyRotator/index.js", ...argsTasks.scrapy],
		process.env.IS_DOCKER ? undefined : "Scrapy"
	);
if (argsTasks.scrapy && answers?.playwrightInDocker && !process.env.IS_DOCKER)
	startChildProcess(
		"docker",
		["run", "-v", "./common/data:/app/common/data", ...getEnvArgsFromAnwsers(answers), "scrapy"],
		process.env.IS_DOCKER ? undefined : "Scrapy"
	);
