<script>
  import { onMount } from 'svelte';
  import { parseDeckList } from '$lib/deck.js';
  import { fetchDeckCards } from '$lib/lorcast.js';
  import { probAtLeastOneInStartingHand, probDrawIfNotInStartHand } from '$lib/probability.js';
  import { getDecks, saveDeck, getDeck, deleteDeck } from '$lib/db.js';

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
  /** @type {Array<{ id: number, name: string, deckList: string, cards: unknown[], createdAt: number }>} */
  let savedDecks = [];
  let saveError = '';
  let saving = false;

  onMount(() => {
    loadSavedDecks();
  });

  async function loadSavedDecks() {
    try {
      savedDecks = await getDecks();
    } catch (e) {
      console.error('Failed to load saved decks', e);
    }
  }

  async function saveCurrentDeck() {
    if (!result?.cards?.length) return;
    saving = true;
    saveError = '';
    const name = window.prompt('Name des Decks:', `Deck ${new Date().toLocaleDateString('de-DE')}`)?.trim() || `Deck ${Date.now()}`;
    if (!name) {
      saving = false;
      return;
    }
    try {
      await saveDeck({
        name,
        deckList,
        cards: result.cards
      });
      await loadSavedDecks();
    } catch (e) {
      saveError = e.message || 'Speichern fehlgeschlagen';
    } finally {
      saving = false;
    }
  }

  async function openSavedDeck(id) {
    try {
      const deck = await getDeck(id);
      if (!deck) return;
      deckList = deck.deckList;
      result = { cards: deck.cards };
      statisticsCounts = (deck.cards || []).map((c) => Math.min(4, Math.max(1, c.count)));
      activeTab = 'statistics';
    } catch (e) {
      console.error('Failed to open deck', e);
    }
  }

  async function removeDeck(id, e) {
    e?.stopPropagation();
    if (!window.confirm('Deck wirklich löschen?')) return;
    try {
      await deleteDeck(id);
      await loadSavedDecks();
    } catch (e) {
      console.error('Failed to delete deck', e);
    }
  }

  async function analyze() {
    loading = true;
    error = '';
    result = null;
    statisticsCounts = [];
    try {
      const entries = parseDeckList(deckList);
      if (entries.length === 0) {
        error = 'Keine gültigen Zeilen in der Deckliste (Format: "Anzahl Kartenname")';
        return;
      }
      const cards = await fetchDeckCards(entries);
      result = { cards };
      statisticsCounts = cards.map((c) => Math.min(4, Math.max(1, c.count)));
    } catch (e) {
      error = e.message || 'Netzwerkfehler. Prüfe die Konsole (z. B. CORS bei Lorcast-API).';
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

  function resetStatisticsCounts() {
    if (!result?.cards?.length) return;
    statisticsCounts = result.cards.map((c) => Math.min(4, Math.max(1, c.count)));
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
    <div class="input-actions">
      <button type="button" on:click={analyze} disabled={loading}>
        {loading ? 'Lade Karten …' : 'Deck analysieren'}
      </button>
      {#if result?.cards?.length}
        <button type="button" class="btn-secondary" on:click={saveCurrentDeck} disabled={saving}>
          {saving ? 'Speichern …' : 'Deck speichern'}
        </button>
      {/if}
    </div>
  </section>

  <section class="saved-decks-section" aria-labelledby="saved-decks-heading">
    <h2 id="saved-decks-heading">Meine Decks</h2>
    {#if saveError}
      <p class="save-error">{saveError}</p>
    {/if}
    {#if savedDecks.length === 0}
      <p class="saved-decks-empty">Noch keine Decks gespeichert. Analysiere ein Deck und klicke auf „Deck speichern“.</p>
    {:else}
      <ul class="saved-decks-list">
        {#each savedDecks as deck (deck.id)}
          <li class="saved-deck-item">
            <button type="button" class="saved-deck-open" on:click={() => openSavedDeck(deck.id)}>
              <span class="saved-deck-name">{deck.name}</span>
              <span class="saved-deck-meta">
                {deck.cards?.reduce((s, c) => s + (c.count || 0), 0) ?? 0} Karten · {new Date(deck.createdAt).toLocaleDateString('de-DE')}
              </span>
            </button>
            <button type="button" class="saved-deck-delete" aria-label="Deck löschen" on:click={(e) => removeDeck(deck.id, e)}>×</button>
          </li>
        {/each}
      </ul>
    {/if}
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
          <button type="button" class="deck-totals-reset" on:click={resetStatisticsCounts} title="Kopien auf Basis-Deck zurücksetzen">Zurücksetzen</button>
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
  /* Mobile first */
  .page {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 1rem 1rem 3rem;
    min-height: 100vh;
  }

  .header {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .header h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
    font-weight: 600;
    letter-spacing: -0.028em;
    line-height: 1.2;
    color: var(--apple-gray-5);
  }

  .subtitle {
    margin: 0;
    color: var(--apple-gray-4);
    font-size: 0.875rem;
    font-weight: 400;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.4;
    padding: 0 0.5rem;
  }

  @media (min-width: 640px) {
    .page {
      max-width: 640px;
      padding: 1.5rem 1.5rem 4rem;
    }
    .header {
      margin-bottom: 1.75rem;
    }
    .header h1 {
      font-size: 2rem;
    }
    .subtitle {
      font-size: 0.9375rem;
      max-width: 28rem;
    }
  }

  @media (min-width: 1024px) {
    .page {
      max-width: 1000px;
      padding: 2rem 2rem 4rem;
    }
    .header {
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 2.25rem;
    }
  }

  .subtitle a {
    color: var(--apple-blue);
    text-decoration: none;
  }

  .subtitle a:hover {
    text-decoration: underline;
  }

  /* Grouped card (iOS-style) – mobile first */
  .input-section {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    margin-bottom: 1.25rem;
    padding: 1rem 1rem 1.25rem;
    background: var(--apple-white);
    border-radius: var(--apple-radius-lg);
    box-shadow: var(--apple-shadow-card);
  }

  @media (min-width: 640px) {
    .input-section {
      gap: 1rem;
      padding: 1.25rem 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .input-section {
      padding: 1.5rem 1.5rem 1.75rem;
    }
  }

  .input-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  .input-actions button {
    margin: 0;
  }

  .input-section label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--apple-gray-4);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .input-section code {
    background: var(--apple-gray-2);
    padding: 0.12em 0.4em;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 0.875rem 1rem;
    min-height: 140px;
    background: var(--apple-gray-0);
    border: none;
    border-radius: var(--apple-radius-sm);
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.47;
    color: var(--apple-gray-5);
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }

  @media (min-width: 640px) {
    textarea {
      padding: 1rem 1rem;
      min-height: 180px;
    }
  }

  @media (min-width: 1024px) {
    textarea {
      min-height: 220px;
    }
  }

  textarea::placeholder {
    color: var(--apple-gray-4);
  }

  textarea:focus {
    outline: none;
    background: var(--apple-white);
    box-shadow: 0 0 0 2px var(--apple-blue);
  }

  textarea:disabled {
    opacity: 0.6;
  }

  button {
    align-self: flex-start;
    padding: 0.75rem 1.25rem;
    min-height: 44px;
    background: var(--apple-blue);
    color: white;
    border: none;
    border-radius: var(--apple-radius-pill);
    font-size: 0.9375rem;
    font-weight: 500;
    font-family: inherit;
    letter-spacing: -0.02em;
    cursor: pointer;
    transition: background 0.2s ease, opacity 0.2s ease, transform 0.1s ease;
    -webkit-tap-highlight-color: transparent;
  }

  @media (min-width: 640px) {
    button {
      padding: 0.625rem 1.25rem;
      min-height: auto;
    }
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  button:hover:not(:disabled) {
    background: var(--apple-blue-hover);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--apple-gray-2);
    color: var(--apple-gray-5);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--apple-gray-3);
  }

  /* Saved decks – grouped list */
  .saved-decks-section {
    margin-bottom: 1.5rem;
  }

  .saved-decks-section h2 {
    margin: 0 0 0.5rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--apple-gray-4);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  @media (min-width: 640px) {
    .saved-decks-section {
      margin-bottom: 1.75rem;
    }
    .saved-decks-section h2 {
      margin-left: 1rem;
      font-size: 0.8125rem;
    }
  }

  .save-error {
    margin: 0 0 0.5rem 1rem;
    font-size: 0.875rem;
    color: #c53030;
  }

  .saved-decks-empty {
    margin: 0;
    padding: 1.25rem 1rem;
    font-size: 0.9375rem;
    color: var(--apple-gray-4);
    background: var(--apple-white);
    border-radius: var(--apple-radius-lg);
    box-shadow: var(--apple-shadow-card);
  }

  .saved-decks-list {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--apple-white);
    border-radius: var(--apple-radius-lg);
    box-shadow: var(--apple-shadow-card);
    overflow: hidden;
  }

  .saved-deck-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--apple-separator);
  }

  .saved-deck-item:last-child {
    border-bottom: none;
  }

  .saved-deck-open {
    flex: 1;
    padding: 1rem 1rem;
    min-height: 44px;
    text-align: left;
    background: none;
    border: none;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  @media (min-width: 640px) {
    .saved-deck-open {
      padding: 0.875rem 1rem;
      min-height: auto;
    }
  }

  .saved-deck-open:hover {
    background: var(--apple-gray-0);
  }

  .saved-deck-open:active {
    background: var(--apple-gray-2);
  }

  .saved-deck-name {
    display: block;
    font-weight: 500;
    color: var(--apple-gray-5);
  }

  .saved-deck-meta {
    display: block;
    font-size: 0.8125rem;
    color: var(--apple-gray-4);
    margin-top: 0.125rem;
    font-weight: 400;
  }

  .saved-deck-delete {
    flex-shrink: 0;
    width: 44px;
    min-height: 44px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 1.25rem;
    line-height: 1;
    color: var(--apple-gray-4);
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  @media (min-width: 640px) {
    .saved-deck-delete {
      width: 2.75rem;
      min-height: auto;
    }
  }

  .saved-deck-delete:hover {
    color: #c53030;
    background: rgba(197, 48, 48, 0.08);
  }

  .error {
    padding: 1rem 1.25rem;
    margin-bottom: 1.25rem;
    background: rgba(197, 48, 48, 0.08);
    color: #c53030;
    border-radius: var(--apple-radius-sm);
    font-size: 0.9375rem;
  }

  .results {
    margin-top: 1.5rem;
  }

  @media (min-width: 640px) {
    .results {
      margin-top: 2rem;
    }
  }

  /* Segmented control (iOS-style tabs) */
  .tabs {
    display: flex;
    gap: 0;
    margin-bottom: 1rem;
    padding: 4px;
    background: var(--apple-gray-2);
    border-radius: var(--apple-radius-pill);
    width: 100%;
    max-width: 320px;
  }

  @media (min-width: 640px) {
    .tabs {
      width: fit-content;
      max-width: none;
      margin-bottom: 1.25rem;
    }
  }

  .tab {
    flex: 1;
    padding: 0.625rem 1rem;
    min-height: 40px;
    background: transparent;
    border: none;
    border-radius: var(--apple-radius-pill);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--apple-gray-5);
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s ease, color 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  @media (min-width: 640px) {
    .tab {
      flex: 0 1 auto;
      padding: 0.5rem 1.25rem;
      min-height: auto;
    }
  }

  .tab:hover:not(.active) {
    color: var(--apple-gray-5);
  }

  .tab.active {
    background: var(--apple-white);
    color: var(--apple-gray-5);
    box-shadow: var(--apple-shadow);
  }

  .tab-panel {
    display: none;
  }

  .tab-panel.visible {
    display: block;
  }

  .tab-panel h2 {
    margin: 0 0 0.375rem;
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: -0.022em;
  }

  .results h2 {
    margin: 0 0 0.375rem;
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: -0.022em;
  }

  .results-intro {
    margin: 0 0 1rem;
    font-size: 0.9375rem;
    color: var(--apple-gray-4);
    line-height: 1.4;
  }

  .deck-totals {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: var(--apple-gray-0);
    border-radius: var(--apple-radius-sm);
    font-size: 0.875rem;
  }

  @media (min-width: 640px) {
    .deck-totals {
      gap: 1rem;
      font-size: 0.9375rem;
    }
  }

  .deck-totals-reset {
    margin-left: auto;
    padding: 0.35rem 0.65rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--apple-blue);
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease, opacity 0.15s ease;
  }

  .deck-totals-reset:hover {
    background: var(--apple-blue-muted);
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
    border-radius: var(--apple-radius-lg);
    box-shadow: var(--apple-shadow-card);
    overflow: hidden;
  }

  @media (max-width: 639px) {
    .stats-list {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .stats-row {
      min-width: 480px;
    }
  }

  .stats-row {
    display: grid;
    grid-template-columns: 1fr auto auto auto auto auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0.75rem 0.75rem;
    border-bottom: 1px solid var(--apple-separator);
    font-size: 0.875rem;
  }

  .stats-row--header {
    font-weight: 600;
    color: var(--apple-gray-4);
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.5rem 0.75rem;
  }

  .stats-row:last-child {
    border-bottom: none;
  }

  @media (min-width: 640px) {
    .stats-row {
      gap: 1rem;
      padding: 0.75rem 1rem;
      font-size: 0.9375rem;
    }
    .stats-row--header {
      font-size: 0.75rem;
      padding: 0.625rem 1rem;
    }
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
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
    border-radius: var(--apple-radius);
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
    transition: background 0.2s ease, color 0.2s ease, transform 0.1s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .stats-btn:active:not(:disabled) {
    transform: scale(0.92);
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
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }

  @media (min-width: 640px) {
    .cards-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }
  }

  @media (min-width: 1024px) {
    .cards-grid {
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.5rem;
    }
  }

  .card-tile {
    background: var(--apple-white);
    border-radius: var(--apple-radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--apple-shadow-card);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }

  .card-tile:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .card-tile img {
    width: 100%;
    height: auto;
    aspect-ratio: 244 / 340;
    object-fit: cover;
    display: block;
  }

  .card-info {
    padding: 1rem 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .card-info h3 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.02em;
    color: var(--apple-gray-5);
  }

  .card-info .count {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--apple-blue);
  }

  .card-info .type {
    margin: 0;
    font-size: 0.8125rem;
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
