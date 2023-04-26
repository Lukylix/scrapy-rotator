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
CMD [ "node", "index.js" ]