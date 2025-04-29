// // helpers/competitors.js
// import OpenAI from "openai";
// import { config } from "dotenv";

// config();
// const openai = new OpenAI();

// /**
//  * Return an array of peer / rival companies for `companyName`.
//  *
//  * @param {string} companyName  e.g. "Infosys"
//  * @param {number} max          how many to return (default 15, hard-capped at 50)
//  * @returns {Promise<string[]>}
//  */
// export async function getCompetitors(companyName, max = 15, prompt) {
//   max = Math.min(max, 50);

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o", // use "gpt-4o" if you have full access
//     temperature: 0,
//     messages: [
//       {
//         role: "system",
//         content: `You are a competitive-intelligence assistant.
// RULES:
// 1. Return results ONLY via the provided function.
// 2. The array must NOT contain the input company itself.
// 3. Think in terms of direct market overlap, similar offerings, size, and geography.
// 4. Also look at the prompt and try to figure out the domain too in order to get the best results.
// ${prompt ? `5. Additional context: ${prompt}` : ""}`,
//       },

//       /* ----- 2 quick examples so the model learns the pattern ----- */
//       {
//         role: "user",
//         content: "Give me 10 competitors of Accenture.",
//       },
//       {
//         role: "assistant",
//         name: "list_competitors",
//         content: JSON.stringify({
//           competitors: [
//             "IBM Consulting",
//             "Deloitte Consulting",
//             "Cognizant",
//             "Capgemini",
//             "Tata Consultancy Services",
//             "Infosys",
//             "Wipro",
//             "HCLTech",
//             "PwC Consulting",
//             "EY Consulting",
//           ],
//         }),
//       },
//       {
//         role: "user",
//         content: "List 5 direct competitors of Coca-Cola.",
//       },
//       {
//         role: "assistant",
//         name: "list_competitors",
//         content: JSON.stringify({
//           competitors: [
//             "PepsiCo",
//             "Dr Pepper Snapple Group",
//             "Nestlé (beverages)",
//             "Keurig",
//             "Monster Beverage",
//           ],
//         }),
//       },

//       /* ----- real prompt ----- */
//       {
//         role: "user",
//         content: `Give me up to ${max} direct competitors of ${companyName}.`,
//       },
//     ],
//     functions: [
//       {
//         name: "list_competitors",
//         description:
//           "Return an array of company names that directly compete with the input company. Never include the input company itself.",
//         parameters: {
//           type: "object",
//           properties: {
//             competitors: {
//               type: "array",
//               items: { type: "string" },
//             },
//           },
//           required: ["competitors"],
//         },
//       },
//     ],
//     function_call: { name: "list_competitors" },
//   });

//   const msg = response.choices[0].message;
//   if (msg.function_call?.name !== "list_competitors") {
//     throw new Error("LLM did not return function call");
//   }

//   let { competitors } = JSON.parse(msg.function_call.arguments);

//   /* ---- final safety filter ---- */
//   competitors = competitors
//     .filter(
//       (c) => c.toLowerCase() !== companyName.toLowerCase() && c.trim() !== ""
//     )
//     .slice(0, max);

//   if (!competitors.length) {
//     throw new Error("No competitors returned");
//   }

//   return competitors;
// }

// helpers/competitors.js
//
// Return the top N competitors PLUS a short “why” tag the LLM used.
//
// ENV  OPENAI_API_KEY

import OpenAI from "openai";
import { config } from "dotenv";
config();

const gpt = new OpenAI();

/**
 * @param {string} client          – e.g. "Infosys"
 * @param {number} max             – default 20
 * @returns {Promise<Array<{ name:string, reason:string }>>}
 */
export async function getCompetitors(client, max = 20) {
  const resp = await gpt.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "Return direct competitors with a one-line rationale.",
      },
      {
        role: "user",
        content: `List up to ${max} direct competitors of ${client}.
Respond ONLY with JSON: {"competitors":[{ "name":"...", "reason":"..." }]}`,
      },
    ],
  });

  const txt = resp.choices[0].message.content.trim();
  const { competitors = [] } = JSON.parse(
    txt.match(/\{[\s\S]*\}/)?.[0] ?? "{}"
  );
  return competitors.slice(0, max);
}
