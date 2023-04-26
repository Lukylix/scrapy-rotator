import axios from "axios";
import fs from "fs";
import cheerio from "cheerio";
import { getFilePath } from "./getFilePath.js";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { readFileSync } from "./readFileSync.js";

dotenv.config();

export async function checkProxies(proxies) {
	//unique ip set
	const uniqueProxies = [...new Set(proxies.map(JSON.stringify))].map(JSON.parse);
	const validProxies = [];
	let myIp = "";

	try {
		myIp = (await axios.get("https://api.ipify.org?format=json")).data.ip;
		console.log("myIp:", myIp);
	} catch (err) {
		console.error(err);
		return validProxies;
	}

	await Promise.all(
		uniqueProxies.map(async (proxy, index) => {
			const start = Date.now();

			try {
				const res = await axios.get("https://api.ipify.org?format=json", {
					timeout: 20000,
					proxy: {
						protocol: "http",
						host: proxy.ip,
						port: proxy.port,
					},
				});

				if (res.status == 200 && res.data?.ip && res.data?.ip != myIp) {
					const finish = Date.now();
					const time = finish - start;
					proxy.good = true;
					proxy.ping = time;
					validProxies.push(proxy);
					console.log(`Checked: ${proxy.ip}:${proxy.port} ${proxy.ping}ms`);
				}
			} catch (err) {
				// ignore errors
			}
		})
	);
	return validProxies;
}

function writeProxiesToFile(proxies, filePath) {
	const fileContent = proxies
		.sort((a, b) => a.ip.localeCompare(b.ip, "en", { numeric: true }))
		.map((proxy) => `${proxy.ip}:${proxy.port}`)
		.join("\n");
	writeFileSync(getFilePath(filePath, import.meta.url), fileContent);
}

function readProxiesFromDirectoryRecursive(directoryPath) {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true });
		return [];
	}
	let proxies = [];
	const files = fs.readdirSync(directoryPath);
	files.forEach((file) => {
		const filePath = `${directoryPath}/${file}`;
		if (fs.statSync(filePath).isDirectory()) {
			readProxiesFromDirectoryRecursive(filePath, proxies);
		} else {
			const lines = readFileSync(filePath, "utf-8").split("\n");
			lines.forEach((line) => {
				line = line.trim();
				if (line) {
					const [ip, port] = line.split(":");
					proxies.push({ ip, port });
				}
			});
		}
	});
	return proxies;
}

export async function getFreeProxies() {
	let proxies = readProxiesFromDirectoryRecursive(getFilePath("../../common/data/proxies/free", import.meta.url));
	try {
		const sslproxies = await axios.get("https://sslproxies.org/");
		const $ = cheerio.load(sslproxies.data);
		$("td:nth-child(1)").each(function (index, value) {
			proxies.push({
				ip: $(this).text(),
				port: $("td:nth-child(2)").eq(index).text(),
			});
		});

		const fineproxy = await axios.get("https://fineproxy.de/wp-content/themes/fineproxyde/proxy-list.php");
		const fineProxies = fineproxy.data;
		fineProxies.forEach((proxi) => {
			proxies.push({
				ip: proxi.ip,
				port: proxi.port,
			});
		});
		proxies = proxies.filter((proxy) => proxy.ip.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/));
		await writeProxiesToFile(proxies, "../../common/data/proxies/valid-proxies.txt");
	} catch (error) {
		console.log(error);
	}
	return proxies;
}

export async function getPremiumProxies() {
	let proxies = readProxiesFromDirectoryRecursive(getFilePath("../../common/data/proxies/premium", import.meta.url));
	console.log("proxies", proxies.length);
	if (proxies.length < 1) {
		const proxiesReponse = await axios.get(
			`https://api.proxyscrape.com/v2/account/datacenter_shared/proxy-list?auth=${process.env.API_KEY}&type=getproxies&country[]=all&protocol=http&format=normal&status=online`
		);
		const proxiesString = proxiesReponse.data;
		fs.writeFileSync(
			getFilePath("../../common/data/proxies/premium/proxyscrape_premium_http_proxies.txt", import.meta.url),
			proxiesString
		);
		proxies = proxiesString.split("\r\n");
		proxies = proxies
			.map((proxi) => {
				const [ip, port] = proxi.split(":");
				return {
					ip,
					port: port,
					failedRequests: 0,
				};
			})
			.filter((proxy) => proxy.ip && proxy.port)
			.sort(() => Math.random() - 0.5);
	} else {
		proxies = proxies.sort(() => Math.random() - 0.5);
	}
	proxies = proxies.filter((proxy) => proxy.ip.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/));
	return proxies;
}
