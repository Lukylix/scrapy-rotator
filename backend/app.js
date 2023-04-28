import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";

import superMarketRouter from "./routes/supermarket.js";
import { waitForService } from "./config/elasticsearch.js";

let app = express();

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/supermarket", superMarketRouter);

app.get("/ready", async (req, res, next) => {
	try {
		await waitForService();
		res.json({ message: "I'm ready!" });
	} catch (error) {
		console.error(`Error waiting for service: ${error}`);
	}
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.json({ error: err.message });
});

export default app;
