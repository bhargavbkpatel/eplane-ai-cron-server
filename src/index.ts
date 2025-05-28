import dotenv from "dotenv";
import express from "express";
import cron from "node-cron";
import { Client } from "pg";
import logger from "utils/logger/logger";
import { processArticle } from "./actions/processArticles";
import { updateStockData } from "./actions/updateStockData";
import { updateMacroLensData } from "./actions/updateMacroLensData";
import { errorHandler } from "lib/middleware/errorHandler";
import { retry } from "utils/retry/retry";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

const client = new Client({
  connectionString: DATABASE_URL,
});

const app = express();
const port = process.env.PORT || 3000;
app.use(errorHandler);

const listenForArticles = async (): Promise<void> => {
  try {
    await client.connect();
    logger.info("Connected to database");

    client.on("notification", async (notification) => {
      try {
        const payload = JSON.parse(notification.payload as string);
        if (payload.id) {
          await retry(async () => await processArticle(payload.id), {
            retries: 3,
            initialDelay: 500,
            onRetry: (error, attempt, delay) => {
              logger.warn(
                `Retrying processArticle for ID ${payload.id}, attempt ${attempt} in ${delay}ms`,
                { error }
              );
            },
          });
        } else {
          logger.warn("Unknown payload format", { payload });
        }
      } catch (error) {
        logger.error("Error processing notification", { error });
      }
    });

    await client.query("LISTEN article_inserted");
    logger.info("Listening for article_inserted notifications...");
  } catch (error) {
    logger.error("Failed to set up notification listener", { error });
    process.exit(1);
  }
};

listenForArticles();

cron.schedule("0 0 1 * * *", async () => {
  try {
    await retry(async () => await updateStockData(), {
      retries: 3,
      initialDelay: 1000,
      onRetry: (error, attempt, delay) => {
        logger.warn(
          `Retrying updateStockData, attempt ${attempt} in ${delay}ms`,
          { error }
        );
      },
    });
  } catch (error) {
    logger.error("Error in scheduled Update Stock Data", { error });
  }
});

cron.schedule("0 0 1 * * *", async () => {
  try {
    await retry(async () => await updateMacroLensData(), {
      retries: 3,
      initialDelay: 1000,
      onRetry: (error, attempt, delay) => {
        logger.warn(
          `Retrying updateMacroLensData, attempt ${attempt} in ${delay}ms`,
          { error }
        );
      },
    });
  } catch (error) {
    logger.error("Error in scheduled Macro lens data", { error });
  }
});

app.listen(port, () => {
  logger.info(`Server running at port ${port}`);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { error: err });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason });
  process.exit(1);
});

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  await client.end();
  process.exit(0);
});
