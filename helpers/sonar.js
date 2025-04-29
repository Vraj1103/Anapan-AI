// helpers/sonar.js
//
// Return an array of companies that have worked with <targetCompany>.
//
// ➊  Query Perplexity Sonar (“sonar”, “sonar-pro”, or “sonar-deep-research”)
// ➋  If Sonar’s answer isn’t valid JSON, pass it to GPT-4o-mini with a
//     function-call schema so we always get {"companies":[ … ]}.
//
// ENV VARS (both required):
//   SONAR_API_KEY   – Perplexity key  (pplx-…)
//   OPENAI_API_KEY  – OpenAI key      (sk-…)

import { config } from "dotenv";
import OpenAI from "openai";
config();

/* ────── clients ────── */
const SONAR_KEY = process.env.SONAR_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!SONAR_KEY) throw new Error("SONAR_API_KEY env var is missing");
if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY env var is missing");

const sonar = new OpenAI({
  apiKey: SONAR_KEY,
  baseURL: "https://api.perplexity.ai",
});
const gpt = new OpenAI({ apiKey: OPENAI_KEY });

/* ────── main export ────── */
export async function getRelatedCompanies(
  targetCompany,
  max = 30,
  model = "sonar-pro", // "sonar" | "sonar-pro" | "sonar-deep-research"
  prompt = ""
) {
  const userPrompt =
    `List up to ${max} and min of 10 external companies that have worked with "${targetCompany}".Also look at the prompt:${prompt} and try to give best results as per requirement ` +
    `Respond ONLY with JSON like: {"companies":["A","B",...]}`;

  /* 1️⃣  call Perplexity */
  const sonarResp = await sonar.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are part of detective Autonomous agents.And your task is to find out all the external or 3rd party services the company is using. No made up facts are allowed.Try to give all possible answers.",
      },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = sonarResp.choices[0].message.content.trim();
  let list = tryParseCompanyJSON(raw);

  /* 2️⃣  if not JSON, normalise via GPT-4o-mini */
  if (!list.length) {
    const gptResp = await gpt.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You receive text that lists companies. " +
            "Extract the company names and return ONLY via the function.",
        },
        { role: "user", content: raw },
      ],
      functions: [
        {
          name: "return_companies",
          description: "Return an array of company names.",
          parameters: {
            type: "object",
            properties: {
              companies: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["companies"],
          },
        },
      ],
      function_call: { name: "return_companies" },
    });

    const fc = gptResp.choices[0].message.function_call;
    if (fc?.name === "return_companies") {
      const parsed = JSON.parse(fc.arguments);
      if (Array.isArray(parsed.companies)) list = parsed.companies;
    }
  }

  if (!list.length) throw new Error("Could not extract company list");
  return list.slice(0, max);
}

/* ────── helper: quick JSON extraction ────── */
function tryParseCompanyJSON(text) {
  // direct parse
  try {
    const obj = JSON.parse(text);
    if (Array.isArray(obj.companies)) return obj.companies;
  } catch {
    /* ignored */
  }

  // pull first {...}
  const m = text.match(/\{[\s\S]*?\}/);
  if (m) {
    try {
      const obj = JSON.parse(m[0]);
      if (Array.isArray(obj.companies)) return obj.companies;
    } catch {
      /* ignored */
    }
  }
  return [];
}
