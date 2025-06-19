import logger from "../utils/logger/logger";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

interface Environment {
  DATABASE_URL: string;
  ELASTIC_API_KEY: string;
  CRON_SECRET: string;
  OPENAI_API_KEY: string;
  ELASTICSEARCH_URL: string;
  GURUFOCUS_API_KEY: string;
  PORT: number;
}

let environment: Environment | null = null;

export const loadEnvironment = async (): Promise<Environment> => {
  if (environment) {
    return environment;
  }

  try {
    const client = new SecretsManagerClient({});

    const command = new GetSecretValueCommand({
      SecretId: process.env.SECRET_PATH,
    });

    const response = await client.send(command);
    if (!response.SecretString) {
      throw new Error("Secret string is empty");
    }

    const secretData = JSON.parse(response.SecretString);

    environment = {
      DATABASE_URL: secretData.DATABASE_URL,
      ELASTIC_API_KEY: secretData.ELASTIC_API_KEY,
      CRON_SECRET: secretData.CRON_SECRET,
      OPENAI_API_KEY: secretData.OPENAI_API_KEY,
      ELASTICSEARCH_URL: secretData.ELASTICSEARCH_URL,
      GURUFOCUS_API_KEY: secretData.GURUFOCUS_API_KEY,
      PORT: secretData.PORT || 3000,
    };

    return environment;
  } catch (error) {
    logger.error("Failed to load environment from Secrets Manager", { error });
    throw error;
  }
};

export const getEnvironment = (): Environment => {
  if (!environment) {
    const error = new Error(
      "Environment not loaded. Call loadEnvironment() first."
    );
    logger.error("Environment not initialized", { error });
    throw error;
  }
  return environment;
};
