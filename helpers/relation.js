// // helpers/classifyVendors.js
// //
// // Classify a vendor list into:
// //   • directCompetitors  – in both competitors[] & vendors[]
// //   • relatedVendors     – not direct competitors but still related to the client
// //
// // ENV VAR  OPENAI_API_KEY  (sk-...)

// import { config } from "dotenv";
// import OpenAI from "openai";
// config();

// const openai = new OpenAI();

// /**
//  * @typedef {Object} Related
//  * @property {string} vendor     - vendor name
//  * @property {string} rationale  - one-sentence “why related” explanation
//  */

// /**
//  * @param {string}  clientCompany
//  * @param {string[]} competitors
//  * @param {Array<string|object>} vendors
//  * @param {number}  maxRelated   – cap for the “related” list (default 20)
//  * @returns {Promise<{ directCompetitors:string[], relatedVendors:Related[] }>}
//  */
// export async function get_related(
//   clientCompany,
//   competitors,
//   vendors,
//   maxRelated = 20
// ) {
//   /* normalise vendor array to plain strings */
//   const vendorNames = vendors.map((v) =>
//     typeof v === "string" ? v : v.vendor || String(v)
//   );

//   const systemPrompt = `
// You are a strategic-sourcing analyst with deep knowledge of corporate
// relationships.

// INPUTS:
// • clientCompany      – the firm whose competitors are listed.
// • competitors[]      – direct rivals of the clientCompany.
// • vendors[]          – companies currently working with the TARGET account.

// TASK:
// 1. "directCompetitors"  → vendors ALSO found in competitors[] (case-insensitive match).
// 2. "relatedVendors"     → vendors NOT in the competitor list but still clearly
//                           related to clientCompany (same sector, shared parent,
//                           frequent joint projects, complementary solutions, etc.).
//    For each related vendor give a short rationale (max 25 words).

// OUTPUT:
// Return ONLY via the provided function call.
// `;

//   const userJson = {
//     clientCompany,
//     competitors,
//     vendors: vendorNames,
//   };

//   const resp = await openai.chat.completions.create({
//     model: "gpt-4o",
//     temperature: 0,
//     messages: [
//       { role: "system", content: systemPrompt.trim() },
//       {
//         role: "user",
//         content:
//           "Data follows in JSON:\n```json\n" +
//           JSON.stringify(userJson, null, 2) +
//           "\n```",
//       },
//     ],
//     functions: [
//       {
//         name: "return_classification",
//         description: "Classify vendors against the competitor list.",
//         parameters: {
//           type: "object",
//           properties: {
//             directCompetitors: {
//               type: "array",
//               items: { type: "string" },
//             },
//             relatedVendors: {
//               type: "array",
//               items: {
//                 type: "object",
//                 properties: {
//                   vendor: { type: "string" },
//                   rationale: { type: "string" },
//                 },
//                 required: ["vendor", "rationale"],
//               },
//             },
//           },
//           required: ["directCompetitors", "relatedVendors"],
//         },
//       },
//     ],
//     function_call: { name: "return_classification" },
//     max_tokens: 900,
//   });

//   const fc = resp.choices[0].message.function_call;
//   if (fc?.name !== "return_classification") {
//     throw new Error("GPT-4o did not return expected function");
//   }

//   const parsed = JSON.parse(fc.arguments);
//   return {
//     directCompetitors: parsed.directCompetitors || [],
//     relatedVendors: (parsed.relatedVendors || []).slice(0, maxRelated),
//   };
// }

// helpers/classifyVendors.js
//
// Accept competitor meta ({name,reason}) + vendor strings and classify.

import OpenAI from "openai";
import { config } from "dotenv";
config();

const gpt = new OpenAI();

/**
 * @param {string} client
 * @param {{name:string,reason:string}[]} competitors
 * @param {string[]} vendors
 */
export async function get_related(client, competitors, vendors) {
  const resp = await gpt.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are a strategic-sourcing analyst.
Return ONLY via function.`,
      },
      {
        role: "user",
        content: `CLIENT: ${client}
COMPETITORS META (JSON): ${JSON.stringify(competitors, null, 2)}
VENDORS at target (JSON): ${JSON.stringify(vendors.slice(0, 80), null, 2)}`,
      },
    ],
    functions: [
      {
        name: "return_classification",
        parameters: {
          type: "object",
          properties: {
            directCompetitors: { type: "array", items: { type: "string" } },
            relatedVendors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vendor: { type: "string" },
                  rationale: { type: "string" },
                },
                required: ["vendor", "rationale"],
              },
            },
          },
          required: ["directCompetitors", "relatedVendors"],
        },
      },
    ],
    function_call: { name: "return_classification" },
  });

  return JSON.parse(resp.choices[0].message.function_call.arguments);
}
