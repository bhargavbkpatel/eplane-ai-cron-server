import dotenv from "dotenv";
import express from "express";
import cron from "node-cron";
import { processArticles } from "./actions/processArticles";
import { updateStockData } from "./actions/updateStockData";
import { updateMacroLensData } from "./actions/updateMacroLensData";
dotenv.config();

const app = express();


cron.schedule("*/15 * * * *", () => {
  console.log("[Cron] Running scheduled articles processing...");
  // processArticles();
});
cron.schedule("0 0 1 * * *", () => {
  console.log("[Cron] Running scheduled Update Stock Data...");
  // updateStockData();
});
cron.schedule("0 0 1 * * *", () => {
  console.log("[Cron] Running scheduled Macro lens data...");
  // updateMacroLensData();
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
