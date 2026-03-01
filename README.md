# Lorcana Deck-Analyse

SvelteKit-App zum Analysieren einer Lorcana-Deckliste. Die Karteninfos werden über die [Lorcast API](https://lorcast.com/docs/api) geladen.

## Starten

```bash
npm install
npm run dev
```

Dann im Browser [http://localhost:5173](http://localhost:5173) öffnen.

## Nutzung

1. Deckliste ins Textfeld einfügen – **eine Zeile pro Karte** im Format: `Anzahl Kartenname`
   - Beispiel: `4 Elsa - Spirit of Winter`
   - Beispiel: `2 Ink Geyser`
2. Auf **„Deck analysieren“** klicken.
3. Für jede Karte werden Bild, Kosten, Ink, Typ, Rarity, Set und (falls vorhanden) Preise angezeigt.

## Technik

- **SvelteKit** (Frontend + API-Route)
- **Lorcast API** (`GET /v0/cards/search`) mit ~80 ms Pause zwischen Anfragen (Rate-Limit)
- Deck-Parser in `src/lib/deck.js`, API-Aufrufe in `src/lib/lorcast.js`

## Build

```bash
npm run build
npm run preview   # Production-Vorschau
```
