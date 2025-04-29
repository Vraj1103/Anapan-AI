import { sonarSearch } from "./sonar.js";

export async function fetchProof(competitor, target) {
  const template = `Provide one reliable public source (URL + 20-word snippet)
                    proving that ${competitor} has worked with or is currently
                    working with ${target}. Respond as:
                    { "competitor": "...", "evidence": "...", "source": "..." }`;
  return await sonarSearch(template);
}
