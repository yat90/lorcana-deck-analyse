import { parseDeckList } from '$lib/deck.js';
import { fetchDeckCards } from '$lib/lorcast.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Ungültiges JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const deckList = typeof body?.deckList === 'string' ? body.deckList : '';
  const entries = parseDeckList(deckList);

  if (entries.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Keine gültigen Zeilen in der Deckliste (Format: "Anzahl Kartenname")' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const cards = await fetchDeckCards(entries);
  return new Response(JSON.stringify({ cards }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
