import { Client } from "@elastic/elasticsearch";

const client = new Client({
	node: "https://localhost:9200",
	auth: {
		password: "MagicWord",
		username: "elastic",
	},
	tls: {
		rejectUnauthorized: false,
		servername: "localhost",
	},
	retry: {
		initialDelayMillis: 5000,
		maxDelayMillis: 5000,
		retries: 100,
	},
});

const waitForService = async () => {
	let isConnected = false;
	while (!isConnected) {
		try {
			await client.ping();
			console.log("Elasticsearch is ready!");
			isConnected = true;
		} catch (error) {
			console.error(`Elasticsearch connection failed: ${error}`);
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}
};

export { client, waitForService };
