import OpenAI from "openai";

import { getConfig } from "../config/env.config";

let instance: OpenAI | null = null;

export const getOpenAIClient = async (): Promise<OpenAI> => {
  if (!instance) {
    const config = getConfig();
    instance = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  return instance;
};