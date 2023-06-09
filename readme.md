# Srapy-rotator

My personnal scraping playground with rotating proxies and various backends/methods of scraping.
This project is intented as a starting point for my futur crawling needs.

## NodeJS

To run the NodeJS application, execute the following commands in your terminal: after clonning the repo.

```bash
npx playwright install
yarn install
yarn --cwd ./scrapyRotator
yarn --cwd ./backend
yarn --cwd ./frontend
node index.js
```

A nice prompt will ask you for everything :).
Thanks to inquirer !

## Docker

### Build

```bash
docker volume create elastic-data
docker build . -t scrapy
dokcer build ./ealsticsearch -t ealsticsearch
```

Running the container :

```bash
 docker compose -f ./docker-compose.yml up
```

You can see common/utils/choicesDefinition.js to see all the possible options

## Setting up

You will need to create and populate the .env file for the scraping to work.

## Frontend

The frontend will show products data make sure to fetch them before hands using docker or nodeJs.

```bash
cd frontend
yarn install
yarn run dev
```

## Screenshots

### CLI

![CLI](./screenshots/cli.png)

### Frontend

![Frontend](./screenshots/frontend.png)
