import { spawn } from "child_process";
import { askAnswers, getAnswersFromArgs, getArgsFromAnswers } from "./common/utils/index.js";
import dotenv from "dotenv";

dotenv.config();

function startChildProcess(command, args, name = "") {
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

	child.stdout.on("data", (data) => {
		console.log(name, ": ", data.toString());
	});

	child.stderr.on("data", (data) => {
		console.error(`${name} error: ${data.toString()}`);
	});
	return child;
}

let answers = getAnswersFromArgs();

// Ask for for missing answers
answers = await askAnswers(answers);

const argsTasks = getArgsFromAnswers(answers);
const childScrapy = startChildProcess("node", ["./scrapyRotator/index.js", ...argsTasks.scrapy], "Scrapy");
