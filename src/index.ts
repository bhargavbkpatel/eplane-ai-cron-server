import { DATABASE_URL } from "config/env.config";
import dotenv from "dotenv";
import express from "express";
import cron from "node-cron";
import pg from "pg";
import { processArticle } from "./actions/processArticles";
import { updateStockData } from "./actions/updateStockData";
import { updateMacroLensData } from "./actions/updateMacroLensData";

dotenv.config();

const client = new pg.Client({
  connectionString: DATABASE_URL,
});

const app = express();
const port = process.env.PORT || 3000;

const listenForArticles = async () => {
  try {
    await client.connect();
    console.log("Connected to database!!");

    client.on("notification", async (notification) => {
      try {
        const payload = JSON.parse(notification.payload as string);
        if (payload.id) {
          await processArticle(payload.id);
        } else {
          console.warn("Unknown payload format:", payload);
        }
      } catch (error) {
        console.error("Error processing notification:", error);
      }
    });
    await client.query("LISTEN article_inserted");
    console.log("Listening for article_inserted notifications...");
  } catch (error) {
    console.error("Failed to set up notification listener:", error);
  }
};

listenForArticles();

cron.schedule("0 0 1 * * *", () => {
  console.log("[Cron] Running scheduled Update Stock Data...");
  // updateStockData();
});
cron.schedule("0 0 1 * * *", () => {
  console.log("[Cron] Running scheduled Macro lens data...");
  // updateMacroLensData();
});

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await client.end();
  process.exit(0);
});
