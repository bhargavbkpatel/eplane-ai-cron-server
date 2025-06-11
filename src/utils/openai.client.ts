import OpenAI from "openai";

let instance: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing in the environment.");
    }
    if (!instance) {
        instance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return instance;
}
