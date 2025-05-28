import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secret_name = "dev/secrets";

const client = new SecretsManagerClient({
  region: "eu-north-1",
});

let response;
export const getSecrets = async () => {
  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );
    const secret = response.SecretString;
    return secret;
  } catch (error) {
    throw error;
  }
};
