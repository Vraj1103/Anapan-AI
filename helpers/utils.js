// helpers/utils.js
export function intersect(competitors = [], collaborations = []) {
  const compSet = new Set(competitors.map((c) => c.toLowerCase()));
  return collaborations.filter((c) => compSet.has(c.company.toLowerCase()));
}
