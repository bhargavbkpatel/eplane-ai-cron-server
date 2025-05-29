import { getSecrets } from "../lib/getSecrets";

export const loadSecrets = async () => {
  const secrets = await getSecrets();

  process.env.DATABASE_URL = secrets.DATABASE_URL;
  process.env.OPENAI_API_KEY = secrets.OPENAI_API_KEY;
  process.env.GURUFOCUS_API_KEY = secrets.GURUFOCUS_API_KEY;
  process.env.ELASTICSEARCH_URL = secrets.ELASTICSEARCH_URL;
  process.env.ELASTIC_API_KEY = secrets.ELASTIC_API_KEY;
  process.env.SECRET_NAME = secrets.SECRET_NAME;
  process.env.AWS_REGION = secrets.AWS_REGION;
  process.env.CRON_SECRET = secrets.CRON_SECRET;
};
