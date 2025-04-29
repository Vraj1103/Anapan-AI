// helpers/summariseInsights.js
import OpenAI from "openai";
import { config } from "dotenv";
config();
const gpt = new OpenAI();

export async function summariseInsights(insights, client, target) {
  const resp = await gpt.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: "Write crisp exec summaries for sales." },
      {
        role: "user",
        content: `CLIENT: ${client}
TARGET: ${target}
INSIGHTS (JSON): ${JSON.stringify(insights.slice(0, 8), null, 2)}
Summarise in ≤120 words:`,
      },
    ],
  });
  return resp.choices[0].message.content.trim();
}
