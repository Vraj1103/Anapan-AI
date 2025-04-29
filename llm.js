import OpenAI from "openai";
import { config } from "dotenv";
config();

export const gpt = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const sonar = new OpenAI({
  apiKey: process.env.SONAR_API_KEY,
  baseURL: process.env.SONAR_BASE_URL || "https://api.perplexity.ai",
});
