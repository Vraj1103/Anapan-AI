// helpers/mergeVendors.js
//
// mergeVendors(domain) → string[]   (max 150 unique names)
//
// Requires:
//   SONAR_API_KEY  (already used)
//   BUILTWITH_KEY  (BuiltWith API v20)

import fetch from "node-fetch";
import { getRelatedCompanies } from "./sonar.js"; // your existing helper
import { config } from "dotenv";
config();

export async function mergeVendors(domain, max = 150) {
  const sonar = await getRelatedCompanies(domain, max / 2, "sonar-pro");

  let built = [];
  try {
    const api = "https://api.builtwith.com/v20/api.json";
    const url = `${api}?KEY=${process.env.BUILTWITH_KEY}&LOOKUP=${domain}`;
    const bw = await (await fetch(url)).json();
    built = bw.Results?.[0]?.Technologies?.map((t) => t.Name) ?? [];
  } catch {
    /* BuiltWith failure is non-fatal */
  }

  const set = new Set(
    [...sonar, ...built].map((s) => s.trim().toLowerCase()).slice(0, max)
  );
  return [...set];
}
