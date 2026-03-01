/**
 * Wahrscheinlichkeit (in Prozent), mindestens eine Kopie einer Karte
 * in der Start hand (7 Karten) zu haben.
 * Hypergeometrische Verteilung: P(mind. 1) = 1 - C(N-K, 7) / C(N, 7)
 *
 * @param {number} deckSize - Gesamtzahl Karten im Deck
 * @param {number} copies - Anzahl Kopien dieser Karte im Deck
 * @param {number} [handSize=7] - Größe der Start hand (Lorcana: 7)
 * @returns {number} Prozent 0–100
 */
export function probAtLeastOneInStartingHand(deckSize, copies, handSize = 7) {
  if (copies <= 0 || deckSize < handSize) return 0;
  if (deckSize - copies < handSize) return 100; // mind. eine Kopie immer in Hand

  // P(0) = C(deckSize - copies, handSize) / C(deckSize, handSize)
  //      = [(N-K)(N-K-1)...(N-K-6)] / [N(N-1)...(N-6)]
  let pZero = 1;
  for (let i = 0; i < handSize; i++) {
    pZero *= (deckSize - copies - i) / (deckSize - i);
  }
  return Math.round((1 - pZero) * 1000) / 10;
}

/**
 * Wahrscheinlichkeit (in Prozent), mindestens eine Kopie dieser Karte zu ziehen,
 * wenn sie nicht in der Start hand war (z. B. Chance beim ersten Zug zu ziehen).
 * Nach der Starthand liegen (deckSize - handSize) Karten im Deck, davon copies Stück.
 * Ein Zug = 1 Karte ziehen: P = copies / (deckSize - handSize).
 *
 * @param {number} deckSize - Gesamtzahl Karten im Deck
 * @param {number} copies - Anzahl Kopien dieser Karte
 * @param {number} [handSize=7] - Größe der Start hand
 * @returns {number} Prozent 0–100
 */
export function probDrawIfNotInStartHand(deckSize, copies, handSize = 7) {
  const remaining = deckSize - handSize;
  if (remaining <= 0 || copies <= 0) return 0;
  if (copies >= remaining) return 100;
  return Math.round((copies / remaining) * 1000) / 10;
}
