# Srapy-rotator

My personnal scraping playground with rotating proxies and letious backends/methods of scraping.
This project is intented as a starting point for my futur crawling needs.

## NodeJS

To run the NodeJS application, execute the following commands in your terminal: after clonning the repo.

```bash
npx playwright install
yarn install
node index.js
```

A nice prompt will ask you for everything :).
Thanks to inquirer !

## Docker

### Build

```bash
docker build . -t scrapy
```

To run the container you will need to pass TASK, BACKEND and PROXIES environement letible like so :

```bash
docker run -v ${pwd}/data:/app/data -e TASK=products-supermarket -e BACKEND=playwright -e PROXIES=premium scrapy
```

Here is a list of possible env values :

```js
TASKS = ["products-infos", "products-supermarket", "cpu-benchmark", "cpu-prices"];
BACKENDS = ["axios", "crawlee", "playwrite"];
PROXIES = ["free", "premium"];
```

## Setting up

You will need to create and populate the .env file for the scraping to work :

## Frontend

The frontend will show products data make sure to fetch them before hands using docker or nodeJs.

```bash
cd frontend
yarn install
yarn run dev
```
