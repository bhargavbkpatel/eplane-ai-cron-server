import OpenAI from "openai";
import { getConfig, loadConfig } from "../config/env.config";

let instance: OpenAI | null = null;

export const getOpenAIClient = async (): Promise<OpenAI> => {
  if (!instance) {
    const config = await loadConfig();
    instance = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  return instance;
};
