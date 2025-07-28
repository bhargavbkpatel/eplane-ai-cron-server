import logger from "../utils/logger/logger";
import { getEnvironment } from "./environment";

interface Config {
  DATABASE_URL: string;
  ELASTIC_API_KEY: string;
  CRON_SECRET: string;
  OPENAI_API_KEY: string;
  ELASTICSEARCH_URL: string;
  GURUFOCUS_API_KEY: string;
  PORT: number;
  VERCEL_BLOB_TOKEN: string;
}

let config: Config | null = null;

export const loadConfig = async (): Promise<Config> => {
  if (config) {
    return config;
  }

  try {
    const secrets = getEnvironment();
    config = {
      DATABASE_URL: secrets.DATABASE_URL,
      ELASTIC_API_KEY: secrets.ELASTIC_API_KEY,
      CRON_SECRET: secrets.CRON_SECRET,
      OPENAI_API_KEY: secrets.OPENAI_API_KEY,
      ELASTICSEARCH_URL: secrets.ELASTICSEARCH_URL,
      GURUFOCUS_API_KEY: secrets.GURUFOCUS_API_KEY,
      PORT: Number(secrets.PORT) || 3000,
      VERCEL_BLOB_TOKEN: secrets.VERCEL_BLOB_TOKEN ,
    };
    process.env.DATABASE_URL = config.DATABASE_URL;

    logger.info("Configuration loaded successfully");
    return config;
  } catch (error) {
    logger.error("Failed to load configuration", { error });
    throw error;
  }
};

export const getConfig = (): Config => {
  if (!config) {
    throw new Error("Configuration not loaded. Call loadConfig() first.");
  }
  return config;
};
