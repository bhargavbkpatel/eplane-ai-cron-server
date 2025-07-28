import express from "express";
import cron from "node-cron";
import { Client } from "pg";
import { loadConfig } from "./config/env.config";
import { loadEnvironment } from "./config/environment";
import { errorHandler } from "./lib/middleware/errorHandler";
import logger from "./utils/logger/logger";
import { retry } from "./utils/retry/retry";

const initializeApp = async () => {
  try {
    // Load environment variables
    await loadEnvironment();
    const config = await loadConfig();
    if (!config.CRON_SECRET) {
      logger.error("CRON_SECRET is not defined. Exiting application.");
      process.exit(1);
    }

    const { processArticle } = await import("./actions/processArticles");
    const { updateMacroLensData } = await import(
      "./actions/updateMacroLensData"
    );
    const { updateStockData } = await import("./actions/updateStockData");
    const { processBlobImages } = await import("./actions/processBlobImage");

    const client = new Client({
      connectionString: config.DATABASE_URL,
    });

    await client.connect();
    logger.info("Connected to the database.");

    const app = express();
    app.use(errorHandler);

    // const handleArticleNotification = async (
    //   notification: any,
    //   eventType: string
    // ) => {
    //   try {
    //     const payload = JSON.parse(notification.payload as string);
    //     logger.info(`Notification received for ${eventType}:`, payload);

    //     if (payload.id) {
    //       await retry(() => processArticle(payload.id), {
    //         retries: 3,
    //         initialDelay: 500,
    //         onRetry: (error, attempt, delay) => {
    //           logger.warn(
    //             `Retrying processArticle for ID ${payload.id}, attempt ${attempt} in ${delay}ms`,
    //             { error }
    //           );
    //         },
    //       });
    //     } else {
    //       logger.warn("Unknown payload format for article notification", {
    //         payload,
    //       });
    //     }
    //   } catch (error) {
    //     logger.error("Error processing article notification", { error });
    //   }
    // };

    const handleBlobImageNotification = async (notification: any) => {
      try {
        const payload = JSON.parse(notification.payload as string);
        logger.info(`Notification received for article_image_update:`, payload);

        if (payload.id) {
          await retry(() => processBlobImages(payload.id), {
            retries: 3,
            initialDelay: 500,
            onRetry: (error, attempt, delay) => {
              logger.warn(
                `Retrying processBlobImages with ID ${payload.id}, attempt ${attempt} in ${delay}ms`,
                { error }
              );
            },
          });
        } else {
          logger.warn("Unknown payload format for blob image", { payload });
        }
      } catch (error) {
        logger.error("Error processing blob image update", { error });
      }
    };

    const listenForArticles = async () => {
      try {
        await client.query("LISTEN article_inserted");
        logger.info("Listening for article_inserted notifications...");
      } catch (error) {
        logger.error("Failed to listen for article_inserted", { error });
        process.exit(1);
      }
    };

    const listenForArticleImageUpdate = async () => {
      try {
        await client.query("LISTEN article_image_update");
        logger.info("Listening for article_image_update...");
      } catch (error) {
        logger.error("Failed to listen for article_image_update", { error });
        process.exit(1);
      }
    };

    const setupListeners = async () => {
      try {
        await client.query("LISTEN article_inserted");
        await client.query("LISTEN article_image_update");
        logger.info(
          "Subscribed to NOTIFY channels: article_inserted, article_image_update"
        );

        client.on("notification", async (notification) => {
          logger.info("Notification received", {
            channel: notification.channel,
            payload: notification.payload,
            processId: notification.processId,
          });

          switch (notification.channel) {
            // case "article_inserted":
            //   await handleArticleNotification(notification, "article_inserted");
            //   await handleBlobImageNotification(notification);
            //   break;
            case "article_image_update":
              await handleBlobImageNotification(notification);
              break;
            default:
              logger.warn("Unknown notification channel", {
                channel: notification.channel,
              });
          }
        });
      } catch (error) {
        logger.error("Failed to set up listeners", { error });
        process.exit(1);
      }
    };

    await setupListeners();

    cron.schedule("0 0 1 * * *", async () => {
      logger.info("Running scheduled job: updateStockData");
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

    app.listen(config.PORT, () => {
      logger.info(`Server running at port ${config.PORT}`);
    });

    process.on("SIGINT", async () => {
      logger.info("Shutting down...");
      await client.end();
      process.exit(0);
    });

    return { app, client };
  } catch (error) {
    logger.error("Failed to initialize application", { error });
    process.exit(1);
  }
};

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { error: err });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason });
  process.exit(1);
});

initializeApp().catch((error) => {
  logger.error("Application startup failed", { error });
  process.exit(1);
});
