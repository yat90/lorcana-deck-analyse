<script>
  import { probAtLeastOneInStartingHand, probDrawIfNotInStartHand } from '$lib/probability.js';

  let deckList = `2 Ink Geyser
4 John Silver - Alien Pirate
4 Malicious, Mean, and Scary
4 Prince Phillip - Royal Explorer
4 Prince Phillip - Vanquisher of Foes
4 Sail The Azurite Sea
4 Strike A Good Match
4 Tipo - Growing Son
2 Under The Sea
4 Vision of the Future
4 You're Welcome`;

  let loading = false;
  let error = '';
  let result = null;
  let activeTab = 'statistics'; // 'information' | 'statistics' (Starting Hand)
  /** @type {number[]} Mutable copy counts for statistics tab (1–4 per card) */
  let statisticsCounts = [];

  async function analyze() {
    loading = true;
    error = '';
    result = null;
    statisticsCounts = [];
    try {
      const res = await fetch('/api/deck-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckList })
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || res.statusText;
        return;
      }
      result = data;
      statisticsCounts = (data.cards || []).map((c) => Math.min(4, Math.max(1, c.count)));
    } catch (e) {
      error = e.message || 'Netzwerkfehler';
    } finally {
      loading = false;
    }
  }

  function addCopy(index) {
    if (statisticsCounts[index] >= 4) return;
    statisticsCounts[index] += 1;
    statisticsCounts = statisticsCounts;
  }

  function removeCopy(index) {
    if (statisticsCounts[index] <= 1) return;
    statisticsCounts[index] -= 1;
    statisticsCounts = statisticsCounts;
  }

  $: statsDeckSize = statisticsCounts.length
    ? statisticsCounts.reduce((s, c) => s + c, 0)
    : 0;

  $: baseDeckSize = result?.cards?.length
    ? result.cards.reduce((s, { count }) => s + count, 0)
    : 0;
</script>

<main class="page">
  <header class="header">
    <h1>Lorcana Deck-Analyse</h1>
    <p class="subtitle">
      Deckliste einfügen – Karteninfos werden über die
      <a href="https://lorcast.com/docs/api" target="_blank" rel="noopener">Lorcast API</a> geladen.
    </p>
  </header>

  <section class="input-section">
    <label for="decklist">Deckliste (eine Zeile pro Karte: <code>Anzahl Kartenname</code>)</label>
    <textarea
      id="decklist"
      bind:value={deckList}
      rows="12"
      placeholder="4 Elsa - Spirit of Winter&#10;2 Ariel - On Human Legs&#10;..."
      disabled={loading}
    ></textarea>
    <button type="button" on:click={analyze} disabled={loading}>
      {loading ? 'Lade Karten …' : 'Deck analysieren'}
    </button>
  </section>

  {#if error}
    <div class="error" role="alert">{error}</div>
  {/if}

  {#if result?.cards?.length}
    <section class="results">
      <nav class="tabs" role="tablist" aria-label="Analyse-Bereiche">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'information'}
          aria-controls="panel-information"
          id="tab-information"
          class="tab"
          class:active={activeTab === 'information'}
          on:click={() => (activeTab = 'information')}
        >Information</button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'statistics'}
          aria-controls="panel-statistics"
          id="tab-statistics"
          class="tab"
          class:active={activeTab === 'statistics'}
          on:click={() => (activeTab = 'statistics')}
        >Starting Hand</button>
      </nav>

      <div id="panel-information" role="tabpanel" aria-labelledby="tab-information" class="tab-panel" class:visible={activeTab === 'information'}>
        <h2>Karten im Deck</h2>
        <p class="results-intro">Alle Karten der Deckliste mit Bild und Angaben.</p>
        <div class="cards-grid">
          {#each result.cards as { name, count, card }}
            <article class="card-tile">
              {#if card}
                <div class="card-tile-image-wrap">
                  <img
                    src={card.image_uris?.digital?.normal ?? card.image_uris?.digital?.small}
                    alt={card.name}
                    width="244"
                    height="340"
                    loading="lazy"
                  />
                </div>
                <div class="card-info">
                  {#if card.image_uris?.digital}
                    <div class="card-preview-wrap card-preview-wrap--tile">
                      <h3 class="card-preview-trigger">{card.name}{#if card.version} – {card.version}{/if}</h3>
                      <div class="card-preview-popover card-preview-popover--overlay card-preview-popover--large">
                        <img src={card.image_uris.digital.large ?? card.image_uris.digital.normal} alt={card.name} />
                      </div>
                    </div>
                  {:else}
                    <h3>{card.name}{#if card.version} – {card.version}{/if}</h3>
                  {/if}
                  <p class="count">×{count}</p>
                  {#if card.type?.length}
                    <p class="type">{card.type.join(', ')}</p>
                  {/if}
                </div>
              {:else}
                <div class="card-info card-not-found">
                  <h3>{name}</h3>
                  <p class="count">×{count}</p>
                  <p>Karte in Lorcast nicht gefunden.</p>
                </div>
              {/if}
            </article>
          {/each}
        </div>
      </div>

      <div id="panel-statistics" role="tabpanel" aria-labelledby="tab-statistics" class="tab-panel" class:visible={activeTab === 'statistics'}>
        <h2>Starting Hand</h2>
        <p class="results-intro">Wahrscheinlichkeit, mindestens 1 Kopie in der Start hand (7 Karten). Kopien pro Karte anpassen (1–4), Berechnung aktualisiert sich sofort.</p>
        <div class="deck-totals">
          <span class="deck-total-item"><strong>Basis-Deck:</strong> {baseDeckSize} Karten</span>
          <span class="deck-total-item"><strong>Aktuell gesamt:</strong> {statsDeckSize} Karten</span>
        </div>
        <ul class="stats-list">
          <li class="stats-row stats-row--header" aria-hidden="true">
            <span class="stats-name-cell">Karte</span>
            <span class="stats-controls">Kopien</span>
            <span class="stats-base">Basis</span>
            <span class="stats-pct">Aktuell</span>
            <span class="stats-diff">Diff.</span>
            <span class="stats-draw-if-not" title="Chance beim 1. Zug zu ziehen, wenn nicht in Starthand">Danach</span>
          </li>
          {#each result.cards as { name, count, card }, i}
            {@const currentCount = statisticsCounts[i] ?? count}
            {@const basePct = probAtLeastOneInStartingHand(baseDeckSize, count, 7)}
            {@const currentPct = probAtLeastOneInStartingHand(statsDeckSize, currentCount, 7)}
            {@const pctDiff = Math.round((currentPct - basePct) * 10) / 10}
            {@const drawIfNotPct = probDrawIfNotInStartHand(statsDeckSize, currentCount, 7)}
            <li class="stats-row">
              <div class="stats-name-cell">
                {#if card?.image_uris?.digital}
                  <div class="card-preview-wrap">
                    <span class="stats-name card-preview-trigger">{card.name}{#if card.version} – {card.version}{/if}</span>
                    <div class="card-preview-popover card-preview-popover--overlay">
                      <img src={card.image_uris.digital.normal ?? card.image_uris.digital.small} alt={card.name} />
                    </div>
                  </div>
                {:else}
                  <span class="stats-name">{name}</span>
                {/if}
              </div>
              <div class="stats-controls">
                <button type="button" class="stats-btn" aria-label="Eine Kopie entfernen" disabled={currentCount <= 1} on:click={() => removeCopy(i)}>−</button>
                <span class="stats-copies" title="Basis: ×{count}">×{currentCount}</span>
                <button type="button" class="stats-btn" aria-label="Eine Kopie hinzufügen" disabled={currentCount >= 4} on:click={() => addCopy(i)}>+</button>
              </div>
              <span class="stats-base" title="Basis: {count} Kopien, Deck {baseDeckSize}">Basis: {basePct}%</span>
              <span class="stats-pct">{currentPct}%</span>
              <span class="stats-diff" class:positive={pctDiff > 0} class:negative={pctDiff < 0}>
                {pctDiff > 0 ? '+' : ''}{pctDiff}%
              </span>
              <span class="stats-draw-if-not" title="Chance, die Karte beim 1. Zug zu ziehen, wenn sie nicht in der Starthand war">{drawIfNotPct}%</span>
            </li>
          {/each}
        </ul>
      </div>
    </section>
  {/if}
</main>

<style>
  .page {
    max-width: 980px;
    margin: 0 auto;
    padding: 3rem 1.5rem 4rem;
  }

  .header {
    margin-bottom: 3rem;
    text-align: center;
  }

  .header h1 {
    margin: 0 0 0.5rem;
    font-size: 2.5rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
  }

  .subtitle {
    margin: 0;
    color: var(--apple-gray-4);
    font-size: 1.0625rem;
    font-weight: 400;
    max-width: 36rem;
    margin-left: auto;
    margin-right: auto;
  }

  .subtitle a {
    color: var(--apple-blue);
    text-decoration: none;
  }

  .subtitle a:hover {
    text-decoration: underline;
  }

  .input-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .input-section label {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--apple-gray-5);
  }

  .input-section code {
    background: var(--apple-gray-2);
    padding: 0.15em 0.5em;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 1rem 1.25rem;
    background: var(--apple-white);
    border: none;
    border-radius: var(--apple-radius-sm);
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.47;
    color: var(--apple-gray-5);
    box-shadow: var(--apple-shadow);
    transition: box-shadow 0.2s ease;
  }

  textarea::placeholder {
    color: var(--apple-gray-4);
  }

  textarea:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.25);
  }

  textarea:disabled {
    opacity: 0.6;
  }

  button {
    align-self: flex-start;
    padding: 0.75rem 1.5rem;
    background: var(--apple-blue);
    color: white;
    border: none;
    border-radius: 980px;
    font-size: 1rem;
    font-weight: 500;
    font-family: inherit;
    letter-spacing: -0.022em;
    cursor: pointer;
    transition: background 0.2s ease, opacity 0.2s ease;
  }

  button:hover:not(:disabled) {
    background: var(--apple-blue-hover);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    background: #fff5f5;
    color: #c53030;
    border-radius: var(--apple-radius-sm);
    font-size: 0.9375rem;
  }

  .results {
    margin-top: 3rem;
  }

  .tabs {
    display: flex;
    gap: 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--apple-gray-2);
  }

  .tab {
    padding: 0.75rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    margin-bottom: -1px;
    font-size: 1rem;
    font-weight: 500;
    color: var(--apple-gray-4);
    cursor: pointer;
    font-family: inherit;
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .tab:hover {
    color: var(--apple-gray-5);
  }

  .tab.active {
    color: var(--apple-blue);
    border-bottom-color: var(--apple-blue);
  }

  .tab-panel {
    display: none;
  }

  .tab-panel.visible {
    display: block;
  }

  .tab-panel h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.022em;
  }

  .results h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.022em;
  }

  .results-intro {
    margin: 0 0 0.75rem;
    font-size: 0.9375rem;
    color: var(--apple-gray-4);
  }

  .deck-totals {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.25rem;
    padding: 0.75rem 1rem;
    background: var(--apple-gray-2);
    border-radius: var(--apple-radius-sm);
    font-size: 0.9375rem;
  }

  .deck-total-item strong {
    font-weight: 600;
    margin-right: 0.25rem;
  }

  .stats-list {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--apple-white);
    border-radius: var(--apple-radius-sm);
    box-shadow: var(--apple-shadow);
    overflow: hidden;
  }

  .stats-row {
    display: grid;
    grid-template-columns: 1fr auto auto auto auto auto;
    gap: 1rem;
    align-items: center;
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid var(--apple-gray-2);
    font-size: 0.9375rem;
  }

  .stats-row--header {
    font-weight: 600;
    color: var(--apple-gray-4);
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .stats-row:last-child {
    border-bottom: none;
  }

  .stats-name-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .stats-name {
    font-weight: 500;
    color: var(--apple-gray-5);
  }

  .card-preview-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .card-preview-trigger {
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 2px;
    transition: text-decoration-color 0.15s ease;
  }

  .card-preview-trigger:hover {
    text-decoration-color: var(--apple-blue);
  }

  .card-preview-popover {
    position: absolute;
    left: 0;
    bottom: 100%;
    margin-bottom: 0.5rem;
    padding: 0.25rem;
    background: var(--apple-white);
    border-radius: var(--apple-radius-sm);
    box-shadow: var(--apple-shadow-lg);
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.15s ease, visibility 0.15s ease;
    z-index: 20;
    pointer-events: none;
  }

  .card-preview-popover--overlay {
    position: fixed;
    left: 50%;
    top: 50%;
    bottom: auto;
    right: auto;
    margin: 0;
    padding: 0.5rem;
    transform: translate(-50%, -50%);
    z-index: 9999;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  }

  .card-preview-wrap:hover .card-preview-popover {
    visibility: visible;
    opacity: 1;
  }

  .card-preview-popover img {
    display: block;
    width: 180px;
    height: auto;
    aspect-ratio: 244 / 340;
    object-fit: cover;
    border-radius: 4px;
  }

  .card-preview-popover--large img {
    width: 244px;
  }

  .card-tile-image-wrap {
    position: relative;
  }

  .stats-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stats-btn {
    width: 2rem;
    height: 2rem;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--apple-gray-2);
    border: none;
    border-radius: 50%;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1;
    color: var(--apple-gray-5);
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .stats-btn:hover:not(:disabled) {
    background: var(--apple-blue);
    color: white;
  }

  .stats-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .stats-copies {
    min-width: 2.5rem;
    text-align: center;
    font-weight: 600;
    color: var(--apple-gray-5);
  }

  .stats-base {
    min-width: 4rem;
    text-align: right;
    color: var(--apple-gray-4);
    font-size: 0.875rem;
  }

  .stats-pct {
    font-weight: 600;
    color: var(--apple-blue);
    min-width: 3.5rem;
    text-align: right;
  }

  .stats-diff {
    min-width: 4rem;
    text-align: right;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .stats-diff.positive {
    color: #0d7d4a;
  }

  .stats-diff.negative {
    color: #c53030;
  }

  .stats-draw-if-not {
    min-width: 3.5rem;
    text-align: right;
    color: var(--apple-gray-5);
    font-size: 0.9375rem;
  }

  .start-hand-chance {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--apple-blue);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
  }

  .card-tile {
    background: var(--apple-white);
    border-radius: var(--apple-radius);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--apple-shadow);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }

  .card-tile:hover {
    box-shadow: var(--apple-shadow-lg);
  }

  .card-tile img {
    width: 100%;
    height: auto;
    aspect-ratio: 244 / 340;
    object-fit: cover;
    display: block;
  }

  .card-info {
    padding: 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .card-info h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.022em;
  }

  .card-info .count {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--apple-blue);
  }

  .card-info .type {
    margin: 0;
    font-size: 0.875rem;
    color: var(--apple-gray-4);
  }

  .card-not-found {
    min-height: 120px;
    justify-content: center;
  }

  .card-not-found p {
    margin: 0;
    color: var(--apple-gray-4);
    font-size: 0.9375rem;
  }
</style>
