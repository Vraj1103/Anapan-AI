// // helpers/insights.js
import { config } from "dotenv";
import OpenAI from "openai";
config();

const sonar = new OpenAI({
  apiKey: process.env.SONAR_API_KEY,
  baseURL: "https://api.perplexity.ai",
});
const gpt = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function fetchCompetitorInsights(opts) {
//   const {
//     client,
//     target,
//     direct = [],
//     related = [],
//     external = [],
//     originalPrompt = "",
//     maxCompanies = 25,
//   } = opts;

//   const relatedNames = related.map((r) =>
//     typeof r === "string" ? r : r.vendor
//   );
//   const companies = [...new Set([...direct, ...relatedNames])].slice(
//     0,
//     maxCompanies
//   );
//   if (!companies.length) throw new Error("No companies to investigate");

//   const sonarPrompt = `
// For EACH company in the list below, confirm collaboration with **${target}**.
// Return ONLY valid JSON:
// [
//   {
//     "company_name":"...",
//     "service":"short description",
//     "citations":["url1","url2"]
//   }
// ]

// Omit companies if no evidence.
// List: ${JSON.stringify(companies, null, 2)}
// Context: client=${client}; sample external=${external.slice(0, 8).join(", ")}
// `;

//   const sonarRaw = (
//     await sonar.chat.completions.create({
//       model: "sonar-pro",
//       temperature: 0,
//       messages: [
//         { role: "system", content: "Return factual answers only." },
//         { role: "user", content: sonarPrompt.trim() },
//       ],
//       max_tokens: 1200,
//     })
//   ).choices[0].message.content.trim();

//   let insights = tryParse(sonarRaw);

//   /* ---------- if Sonar not JSON → GPT-4o-mini ---------- */
//   if (!insights.length) {
//     console.warn("Sonar output not JSON, handing to GPT-4o-mini");
//     console.debug("RAW SONAR TEXT ↓\n", sonarRaw.slice(0, 800), "\n───");

//     const gptResp = await gpt.chat.completions.create({
//       model: "gpt-4o-mini",
//       temperature: 0,
//       messages: [
//         {
//           role: "system",
//           content:
//             "Re-emit the data you receive via the function ONLY. " +
//             "No additional commentary.",
//         },
//         { role: "user", content: sonarRaw },
//       ],
//       functions: [
//         {
//           name: "return_insights",
//           description: "Return cleaned insight objects.",
//           parameters: {
//             type: "object",
//             properties: {
//               companies: {
//                 type: "array",
//                 items: {
//                   type: "object",
//                   properties: {
//                     company_name: { type: "string" },
//                     service: { type: "string" },
//                     citations: {
//                       type: "array",
//                       items: { type: "string" },
//                     },
//                   },
//                   required: ["company_name", "service", "citations"],
//                 },
//               },
//             },
//             required: ["companies"],
//           },
//         },
//       ],
//       function_call: { name: "return_insights" }, // ← forces JSON
//       max_tokens: 800,
//     });

//     const fc = gptResp.choices[0].message.function_call;
//     const gptJSON = fc?.arguments || gptResp.choices[0].message.content || "";

//     insights = tryParse(gptJSON);
//   }

//   if (!insights.length) {
//     console.error("Final text that failed to parse:\n", sonarRaw.slice(0, 800));
//     throw new Error("Could not extract insights");
//   }

//   return insights;
// }

// /* ---------- helper ---------- */
// function tryParse(txt) {
//   // case 1: wrapped object
//   try {
//     const o = JSON.parse(txt);
//     if (Array.isArray(o.companies)) return o.companies;
//     if (Array.isArray(o)) return o; // <-- accept top-level array
//   } catch {}

//   // case 2: grab first {...}
//   const m = txt.match(/\{[\s\S]*?\}/);
//   if (m) {
//     try {
//       const o = JSON.parse(m[0]);
//       if (Array.isArray(o.companies)) return o.companies;
//       if (Array.isArray(o)) return o;
//     } catch {}
//   }
//   return [];
// }

// helpers/insights.js  – trimmed to essentials, parallel chunks

// …imports unchanged…

// const CHUNK = 6; // companies per Sonar call

// export async function fetchCompetitorInsights(opts) {
//   const companiesMaster = [
//     ...new Set([
//       ...opts.direct,
//       ...opts.related.map((r) => (typeof r === "string" ? r : r.vendor)),
//     ]),
//   ].slice(0, opts.maxCompanies ?? 25);

//   const chunks = [];
//   for (let i = 0; i < companiesMaster.length; i += CHUNK)
//     chunks.push(companiesMaster.slice(i, i + CHUNK));

//   const chunkResults = await Promise.all(
//     chunks.map((list) => querySonar(list, opts.target))
//   );

//   return chunkResults.flat();
// }

// /* ---- inner helpers below ---- */

// async function querySonar(list, target) {
//   const prompt = `Confirm work with **${target}** for each company in ${JSON.stringify(
//     list
//   )}.
// Return JSON array [{"company_name":"...","service":"...","citations":["..."]}]`;

//   const raw = (
//     await sonar.chat.completions.create({
//       model: "sonar-pro",
//       temperature: 0,
//       messages: [
//         { role: "system", content: "Return factual answers only." },
//         { role: "user", content: prompt },
//       ],
//     })
//   ).choices[0].message.content.trim();

//   let arr = tryParse(raw);
//   if (!arr.length) arr = await cleanWithGPT(raw);
//   return arr.filter((o) => Array.isArray(o.citations) && o.citations.length);
// }

// function tryParse(t) {
//   try {
//     const j = JSON.parse(t.match(/\[.*\]/s)?.[0] ?? "[]");
//     return j;
//   } catch {
//     return [];
//   }
// }

// async function cleanWithGPT(raw) {
//   const r = await gpt.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0,
//     messages: [
//       { role: "system", content: "Format into JSON array via function." },
//       { role: "user", content: raw },
//     ],
//     functions: [
//       {
//         name: "return_clean",
//         parameters: {
//           type: "object",
//           properties: {
//             companies: { type: "array", items: { type: "object" } },
//           },
//           required: ["companies"],
//         },
//       },
//     ],
//     function_call: { name: "return_clean" },
//   });
//   return (
//     JSON.parse(r.choices[0].message.function_call.arguments).companies ?? []
//   );
// }

// import { config } from "dotenv";
// import OpenAI from "openai";
// config();

/* ---------- LLM clients ---------- */
// const sonar = new OpenAI({
//   apiKey: process.env.SONAR_API_KEY,
//   baseURL: "https://api.perplexity.ai",
// });
// const gpt = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------- public API ---------- */
export async function fetchCompetitorInsights(opts) {
  const companiesMaster = [
    ...new Set([
      ...(opts.direct ?? []),
      ...(opts.related ?? []).map((r) =>
        typeof r === "string" ? r : r.vendor
      ),
    ]),
  ].slice(0, opts.maxCompanies ?? 25);

  if (!companiesMaster.length) throw new Error("No companies to investigate");

  const CHUNK = 6;
  const chunks = [];
  for (let i = 0; i < companiesMaster.length; i += CHUNK)
    chunks.push(companiesMaster.slice(i, i + CHUNK));

  const results = await Promise.all(
    chunks.map((list) => querySonar(list, opts.target))
  );

  return results.flat();
}

/* ---------- internal helpers ---------- */

async function querySonar(list, target) {
  const prompt =
    `Confirm collaboration with **${target}** for each company in ` +
    `${JSON.stringify(list)}.\n` +
    `Return ONLY a JSON array like:\n` +
    `[{"company_name":"...","service":"...","citations":["url"]}]`;

  /* 1️⃣  ── Sonar call ── */
  const resp = await sonar.chat.completions.create({
    model: "sonar-pro",
    temperature: 0,
    messages: [
      { role: "system", content: "Return factual answers only." },
      { role: "user", content: prompt },
    ],
    max_tokens: 900,
  });

  const headerCitations = resp.citations ?? []; // URLs array
  const raw = resp.choices[0].message.content.trim();

  /* 2️⃣  ── Parse or clean ── */
  let arr = tryParse(raw);
  if (!arr.length) arr = await cleanWithGPT(raw);

  /* guard-rail */
  if (!Array.isArray(arr)) arr = [];

  /* 3️⃣  ── Map numeric refs → URLs ── */
  const fixed = arr.map((obj) => {
    const mapped = (obj.citations || []).map((c) =>
      /^\d+$/.test(c) ? headerCitations[Number(c) - 1] ?? c : c
    );
    return { ...obj, citations: mapped };
  });

  return fixed.filter((o) => Array.isArray(o.citations) && o.citations.length);
}

/* ---------- helper: robust JSON parse ---------- */
function tryParse(text) {
  // 1. full JSON parse
  try {
    const o = JSON.parse(text);
    if (Array.isArray(o)) return o; // already array
    if (Array.isArray(o.companies)) return o.companies;
  } catch {
    /* ignore */
  }

  // 2. extract first […] or {…}
  const bracket = text.match(/\[[\s\S]*?\]/s);
  if (bracket) {
    try {
      return JSON.parse(bracket[0]);
    } catch {}
  }
  const brace = text.match(/\{[\s\S]*?\}/s);
  if (brace) {
    try {
      const o = JSON.parse(brace[0]);
      if (Array.isArray(o.companies)) return o.companies;
    } catch {}
  }
  return [];
}

async function cleanWithGPT(raw) {
  const r = await gpt.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: "Format into JSON array via function." },
      { role: "user", content: raw },
    ],
    functions: [
      {
        name: "return_clean",
        parameters: {
          type: "object",
          properties: {
            companies: { type: "array", items: { type: "object" } },
          },
          required: ["companies"],
        },
      },
    ],
    function_call: { name: "return_clean" },
  });

  const jsonText =
    r.choices[0].message.function_call?.arguments ||
    r.choices[0].message.content ||
    "[]";

  try {
    const obj = JSON.parse(jsonText);
    return Array.isArray(obj.companies) ? obj.companies : obj;
  } catch {
    return [];
  }
}
