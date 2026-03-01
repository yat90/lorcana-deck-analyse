/**
 * Parst eine Deckliste im Format "Anzahl Kartenname" pro Zeile.
 * @param {string} text - Roher Text der Deckliste
 * @returns {{ name: string, count: number }[]} Eindeutige Karten mit Anzahl
 */
export function parseDeckList(text) {
  const lines = text.trim().split('\n').filter((line) => line.trim());
  const byName = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex <= 0) continue;

    const countStr = trimmed.slice(0, spaceIndex);
    const count = parseInt(countStr, 10);
    if (Number.isNaN(count) || count < 1) continue;

    const name = trimmed.slice(spaceIndex + 1).trim();
    if (!name) continue;

    const existing = byName.get(name) ?? 0;
    byName.set(name, existing + count);
  }

  return Array.from(byName.entries()).map(([name, count]) => ({ name, count }));
}
