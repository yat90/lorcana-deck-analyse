const LORCAST_API = 'https://api.lorcast.com/v0';
const DELAY_MS = 200; // 50–100 ms zwischen Requests (Lorcast-Empfehlung)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {string} cardName */
function buildSearchQuery(cardName) {
  return `${cardName.replace(/"/g, '\\"').replace('-','')}`;
}

/**
 * @param {string} cardName
 * @returns {Promise<import('$lib/types').LorcastCard | null>}
 */
async function fetchCardByName(cardName) {
  const q = buildSearchQuery(cardName);
  const url = `${LORCAST_API}/cards/search?q=${encodeURIComponent(q)}&unique=cards`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const results = data?.results;
  if (!Array.isArray(results) || results.length === 0) return null;
  return results[0];
}

/**
 * @param {{ name: string, count: number }[]} entries
 * @returns {Promise<{ name: string, count: number, card: import('$lib/types').LorcastCard | null }[]>}
 */
export async function fetchDeckCards(entries) {
  const out = [];
  for (const { name, count } of entries) {
    await sleep(DELAY_MS);
    const card = await fetchCardByName(name);
    out.push({ name, count, card });
  }
  return out;
}
