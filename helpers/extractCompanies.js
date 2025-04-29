/* ---------- BETTER extractor ---------- */
import OpenAI from "openai";
import { config } from "dotenv";
config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
if (!openai.apiKey) {
  throw new Error("OPENAI_API_KEY env var is missing");
}
export async function extractCompanies(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or "gpt-4o"
    temperature: 0,
    messages: [
      {
        role: "system",
        content: [
          "You are an information-extraction assistant.",
          "• The *client company* is the one that wants to spy on its competitors.",
          "• The *target company* is the account they want intel about.",
          "Return ONLY via the provided function.",
        ].join("\n"),
      },

      /* ---------- 2 few-shot examples ---------- */
      {
        role: "user",
        content: "Find Infosys competitors working with Virgin Media",
      },
      {
        role: "assistant",
        name: "extract_companies",
        content: JSON.stringify({
          client_company: "Infosys",
          target_company: "Virgin Media",
        }),
      },
      {
        role: "user",
        content: "Show me Accenture’s rivals that have deals with Walmart",
      },
      {
        role: "assistant",
        name: "extract_companies",
        content: JSON.stringify({
          client_company: "Accenture",
          target_company: "Walmart",
        }),
      },

      /* ---------- real user prompt ---------- */
      { role: "user", content: prompt },
    ],
    functions: [
      {
        name: "extract_companies",
        description:
          "Return the client company (the one seeking competitors) and the target company (the account).",
        parameters: {
          type: "object",
          properties: {
            client_company: { type: "string" },
            target_company: { type: "string" },
          },
          required: ["client_company", "target_company"],
        },
      },
    ],
    function_call: { name: "extract_companies" },
  });

  const msg = response.choices[0].message;
  if (msg.function_call?.name !== "extract_companies") {
    throw new Error("LLM failed to extract companies");
  }

  let { client_company, target_company } = JSON.parse(
    msg.function_call.arguments
  );

  /* ---------- sanity-check / auto-swap ---------- */
  if (
    prompt.toLowerCase().includes(client_company.toLowerCase() + " competitors")
  ) {
    // looks good
  } else if (
    prompt.toLowerCase().includes(target_company.toLowerCase() + " competitors")
  ) {
    // they’re reversed → swap
    [client_company, target_company] = [target_company, client_company];
  }

  return { client_company, target_company };
}
