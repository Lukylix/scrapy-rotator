import { spawn } from "child_process";
import { askAnswers, getAnswersFromArgs, getArgsFromAnswers } from "./common/utils/index.js";
import dotenv from "dotenv";
import { getAnswersFromEnv } from "./common/utils/getAnswersFromEnv.js";
import { getEnvArgsFromAnwsers } from "./common/utils/getEnvArgsFromAnswer.js";
import axios from "axios";

dotenv.config();

const noLogsFor = ["elasticsearch"];

function getNextCronJobTime(cronString) {
	const regex = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/;

	const [, minute, hour, dayOfMonth, month, dayOfWeek, command] = cronString.match(regex);

	const now = new Date();
	const nextDate = new Date(
		now.getFullYear(),
		parseInt(month) - 1,
		parseInt(dayOfMonth),
		parseInt(hour),
		parseInt(minute),
		0,
		0
	);
	const diff = nextDate - now;
	const nextInterval = diff < 0 ? 7 * 24 * 60 * 60 * 1000 + diff : diff;

	return nextInterval;
}

async function startChildProcess(command, args, name = "", cronSchedule = null) {
	let child;
	child = spawn(command, args, { env: process.env });
	let asExited = false;

	child.on("exit", (code, signal) => {
		console.log(`Child process exited with code ${code} and signal ${signal}.`);

		// Restart the child process only if it crashed
		if (code !== 0) {
			setTimeout(() => {
				console.log("Restarting child process...");
				startChildProcess(command, args, name);
			}, 2000);
		}
		{
			asExited = true;
			if (cronSchedule) {
				const nextCronJobTime = getNextCronJobTime(cronSchedule);
				console.log(`Next cron job in ${nextCronJobTime / 1000} seconds`);
				setTimeout(() => {
					if (asExited) {
						spawn(command, args, { env: process.env });
					}
				}, nextCronJobTime);
			}
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
		console.error(`${name} error: ${data.toString()}`);
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
answers = { ...answers, ...(await askAnswers(answers)) };
const argsTasks = getArgsFromAnswers(answers);
if (process.env.IS_DOCKER) console.log("Running in docker runing sub containers is not implemented yet");
if (argsTasks?.elasticsearch?.length > 0 && !process.env.IS_DOCKER)
	startChildProcess("docker", ["compose", "-f", "./elasticsearch/docker-compose.yml", "up"], "Elasticsearch");
if ((argsTasks.scrapy && !answers?.playwrightInDocker) || (argsTasks.scrapy && process.env.IS_DOCKER))
	startChildProcess(
		"node",
		["./scrapyRotator/index.js", ...argsTasks.scrapy],
		process.env.IS_DOCKER ? undefined : "Scrapy",
		answers?.cronSchedule
	);
if (argsTasks.scrapy && answers?.playwrightInDocker && !process.env.IS_DOCKER)
	startChildProcess(
		"docker",
		["run", "-v", "./common/data:/app/common/data", ...getEnvArgsFromAnwsers(answers), "scrapy"],
		process.env.IS_DOCKER ? undefined : "Scrapy"
	);
if (argsTasks?.backend?.length > 0) {
	startChildProcess("nodemon", ["./backend/index.js", ...(argsTasks?.api || [])], "API");
}
if (argsTasks?.frontend?.length > 0) {
	startChildProcess("node", ["./frontend/node_modules/vite/bin/vite.js", "./frontend"], "Frontend");
}
