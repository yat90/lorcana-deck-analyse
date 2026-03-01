
// INPUT: Decklist als Text
const deckText = `
2 Ink Geyser
4 John Silver - Alien Pirate
4 Malicious, Mean, and Scary
4 Prince Phillip - Royal Explorer
4 Prince Phillip - Vanquisher of Foes
4 Sail The Azurite Sea
4 Strike A Good Match
4 Tipo - Growing Son
2 Under The Sea
4 Vision of the Future
4 You're Welcome
4 Basil - Undercover Detective
4 Cinderella - Dream Come True
4 Clarabelle - Clumsy Guest
4 Clarabelle - Light on Her Hooves
4 Donald Duck - Perfect Gentleman
`;
const drawEffects = ["Vision of the Future", "Strike A Good Match"];
const targetCards = ["Sail The Azurite Sea"];

// parse Deck
function parseDeck(text) {
  const lines = text.trim().split("\n");
  let deck = [];
  lines.forEach((line) => {
    const parts = line.trim().split(" ");
    const count = parseInt(parts[0], 10);
    const cardName = parts.slice(1).join(" ");
    for (let i = 0; i < count; i++) {
      deck.push(cardName);
    }
  });
  return deck;
}

// draw random hand
function drawHand(deck, handSize) {
  const copy = deck.slice();
  const hand = [];
  for (let i = 0; i < handSize; i++) {
    if (copy.length === 0) break;
    const idx = Math.floor(Math.random() * copy.length);
    hand.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return hand;
}

// check if hand has target cards
function hasAny(hand, targets) {
  return hand.some((c) => targets.includes(c));
}

// run simulation
function simulate(options) {
  const {
    deck,
    sims = 100000,
    handSize = 7,
    targets = [],
  } = options;

  let countHit = 0;
  for (let i = 0; i < sims; i++) {
    const hand = drawHand(deck, handSize);
    if (hasAny(hand, targets)) {
      countHit++;
    }
  }

  return countHit / sims;
}

// build and run
const deck = parseDeck(deckText);

// example: chance to see at least one "Sail The Azurite Sea"
const oddsSail = simulate({
  deck,
  sims: 200000,
  handSize: 7,
  targets: targetCards,
});

console.log("Chance mind. 1 Sail The Azurite Sea in 7:", oddsSail);

// a second example: chance to see *any* draw effect
const oddsDraws = simulate({
  deck,
  sims: 200000,
  handSize: 7,
  targets: drawEffects,
});

console.log("Chance mind. 1 Draw-Effekt:", oddsDraws);