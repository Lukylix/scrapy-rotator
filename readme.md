docker build . -t scrapy
docker run scrapy -- --task=products-supermarket --backend=playwright --proxies=premium
docker run -e TASK=products-supermarket -e BACKEND=playwright -e PROXIES=premium scrapy

```js
TASKS = ["products-infos", "products-supermarket"];
```

docker run -v ${pwd}/data:/app/data -e TASK=products-supermarket -e BACKEND=playwright -e PROXIES=premium scrapy
docker run -v D:/Workspace/Scrap/Rotator/data:/app/data -e TASK=products-infos -e BACKEND=playwright -e PROXIES=premium scrapy
