import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import logger from "utils/logger/logger";

const secret_name = "dev/secrets"; // Replace with your secret name

const client = new SecretsManagerClient({
  region: "eu-north-1", // Replace with your AWS region
});

export const getSecrets = async () => {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );
    const secret = response.SecretString;
    return JSON.parse(secret as string);
  } catch (error) {
    logger.error(`[getSecrets] Error fetching secret: ${error}`);
    throw error;
  }
};
