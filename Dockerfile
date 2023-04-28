FROM mcr.microsoft.com/playwright
RUN mkdir -p app && chown -R root:root app
WORKDIR /app
ENV PATH="./node_modules/.bin:$PATH"
ENV IS_DOCKER=true
RUN npx playwright install
COPY package.json .
USER root
RUN npm install
COPY  . .

WORKDIR /app/backend
RUN npm install
WORKDIR /app/frontend
RUN npm install
WORKDIR /app/scrapyRotator
RUN npm install
WORKDIR /app

CMD [ "node", "index.js" ]