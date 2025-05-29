import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import logger from "../utils/logger/logger";

const secret_name = process.env.SECRET_NAME;

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
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
