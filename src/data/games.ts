import { GameId, GameMeta } from '../types';
import { PAYOUTS } from '../utils/store';

export const GAMES_METADATA: Record<GameId, GameMeta> = {
  dots: {
    id: 'dots',
    name: 'Dots and Boxes',
    icon: '🔲✏️',
    desc: 'Claim the most boxes',
    p: [2, 2],
    payout: PAYOUTS.dots,
    rules:
      'Players take turns drawing ONE line between two dots on a 4×4 grid of boxes. If your line completes the 4th side of a box, the box is yours — and you MUST take another turn. When every box is claimed, the player with the most boxes wins. Official rules, pencil-and-paper style.'
  },
  ttt: {
    id: 'ttt',
    name: 'Tic-Tac-Toe',
    icon: '❌⭕',
    desc: 'Three in a row',
    p: [2, 2],
    payout: PAYOUTS.ttt,
    rules:
      "X goes first. Players take turns marking one square of the 3×3 grid. First to get three in a row — across, down or diagonally — wins. If all nine squares fill with no line, it is a draw (a 'cat\\'s game')."
  },
  hangman: {
    id: 'hangman',
    name: 'Hangman',
    icon: '🪢✏️',
    desc: 'Guess the word, save the stickman',
    p: [1, 2],
    payout: PAYOUTS.hangman,
    rules:
      'One player thinks of a word; the other guesses letters one at a time. A correct letter fills in every blank where it belongs. A wrong letter draws one more piece of the gallows and the stick figure. Official version: SIX wrong guesses and the figure is complete — the guesser loses. Guess the whole word first to win.'
  },
  sprouts: {
    id: 'sprouts',
    name: 'Sprouts',
    icon: '🌱✏️',
    desc: 'Connect dots, add a dot, last move wins',
    p: [2, 2],
    payout: PAYOUTS.sprouts,
    rules:
      'Start with 3 dots. On your turn, draw a line connecting two dots (or a loop back to the same dot) and place a NEW dot somewhere on your line. No dot may have more than 3 lines touching it (a loop counts as 2). Lines may not cross. The player who cannot make a legal move loses.'
  },
  sim: {
    id: 'sim',
    name: 'Sim',
    icon: '⬡✏️',
    desc: 'Force a triangle — in THEIR color',
    p: [2, 2],
    payout: PAYOUTS.sim,
    rules:
      'Before the game you pick 6 to 10 dots and a board shape: Ring, Grid or Scatter. Players take turns drawing a line between two dots IN THEIR OWN COLOR (you are blue, the other player is red). If you complete a triangle whose three sides are ALL YOUR OWN color, YOU lose on the spot. Last player standing wins.'
  },
  bulls: {
    id: 'bulls',
    name: 'Bulls and Cows',
    icon: '🐂✏️',
    desc: 'Crack the 4-digit code',
    p: [1, 2],
    payout: PAYOUTS.bulls,
    rules:
      'A secret 4-digit number is written down — all four digits different. You guess a 4-digit number (also all different digits). For each guess you score: a BULL for every digit in exactly the right position, and a COW for every right digit in the wrong position. Crack the code in 10 guesses or fewer to win.'
  },
  categories: {
    id: 'categories',
    name: 'Categories',
    icon: '🔤✏️',
    desc: 'Name · Place · Animal · Thing · Food',
    p: [1, 2],
    payout: PAYOUTS.categories,
    rules:
      'A letter is chosen at random. You have 60 seconds to write one answer for every category — Name, Place, Animal, Thing, Food — and every answer MUST start with that letter. Scoring the official way: a valid answer nobody else has scores 10, a valid answer the other player also has scores 5, and a blank or invalid answer scores 0. Highest total wins.'
  },
  mash: {
    id: 'mash',
    name: 'MASH',
    icon: '🔮✏️',
    desc: 'Pick Love, Work, Money… the spirits decide',
    p: [1, 4],
    payout: PAYOUTS.mash,
    rules:
      'The classic fortune teller, mystical edition. First pick what you want a fortune about: Love, Work, Money, Kids, Home, Travel or Luck. Then give the spirits your birthday — they will read your zodiac sign, your ruling planet and your element — and fill in the three blanks they ask for (a name, a color, a number). The spirits run the ancient MASH count through over 500 fortune lines, crossing off readings until yours remains, woven from your own words and your own stars. In Home, the great count also settles the oldest question of all: Mansion, Apartment, Shack or House.'
  },
  taboo: {
    id: 'taboo',
    name: 'Taboo',
    icon: '🚫✏️',
    desc: 'Guess it — without the forbidden words',
    p: [1, 4],
    payout: PAYOUTS.taboo,
    rules:
      'A card shows a TARGET word and a list of TABOO words that may not be said. The clue-giver describes the target without using the target or ANY taboo word; the guessers call out answers. Here the computer deals the cards and gives a clean clue that uses none of the forbidden words — you type the target. 60 seconds, as many cards as you can: 5+ correct wins.'
  },
  crossword: {
    id: 'crossword',
    name: 'Crosswords',
    icon: '🔡✏️',
    desc: '1,000 real crosswords — track your finishes',
    p: [1, 2],
    payout: PAYOUTS.crossword,
    rules:
      'Real newspaper-style crosswords: 1,000 interlocking puzzles (8×8 and 9×9) where every letter is crossed by an Across and a Down answer. The checklist screen tracks you — finished puzzles earn a ✔️ and the count is saved on your device. Tap a square to pick its word (tap again to switch Across/Down), type letters, and use Check to mark right and wrong squares. Stuck? The answers are printed at the bottom of the puzzle, upside down, just like in the newspaper — flip your phone if you must peek! Revealing the answers finishes the round without checklist credit; solve the whole grid yourself to earn the ✔️ and the points.'
  },
  wordsearch: {
    id: 'wordsearch',
    name: 'Word Search',
    icon: '🔎✏️',
    desc: 'Find the hidden words',
    p: [1, 2],
    payout: PAYOUTS.wordsearch,
    rules:
      'Eight words are hidden in the 10×10 grid of letters — forwards across, down, or diagonally. Tap the FIRST letter of a word, then tap its LAST letter to circle it. Find all eight words to win. Your time is shown — faster is better!'
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    icon: '👻✏️',
    desc: "Don't finish the word",
    p: [2, 2],
    payout: PAYOUTS.ghost,
    rules:
      'Players take turns adding ONE letter to a growing word fragment. Every player must have a real word in mind that starts with the fragment. If you add a letter that COMPLETES a word of 4+ letters, you lose the round. You may instead CHALLENGE the player before you. Round losers collect letters of G-H-O-S-T. First to spell GHOST loses.'
  },
  ladder: {
    id: 'ladder',
    name: 'Word Ladders',
    icon: '🪜✏️',
    desc: 'One letter at a time',
    p: [1, 2],
    payout: PAYOUTS.ladder,
    rules:
      'Start at the given word and reach the target word by changing EXACTLY ONE letter at a time. Every step must be a real word in the dictionary. The par shows the best known number of steps — match it if you can!'
  },
  consequences: {
    id: 'consequences',
    name: 'Consequences',
    icon: '📝✏️',
    desc: 'The folded-paper story game',
    p: [1, 4],
    payout: PAYOUTS.consequences,
    rules:
      "The classic fold-over story. Each player secretly writes their lines — an adjective, a man's name, another adjective, a woman's name, a place, what HE said, what SHE said, and what the consequence was — with the paper folded so nobody sees previous lines. Read the hilarious combined story at the big reveal!"
  },
  telephone: {
    id: 'telephone',
    name: 'Paper Telephone',
    icon: '📞✏️',
    desc: 'Write it, draw it, guess it — it mutates!',
    p: [1, 4],
    payout: PAYOUTS.telephone,
    rules:
      'Players sit in a chain. The first writes a phrase: the next player must DRAW the phrase, the next must GUESS the drawing in words, the next DRAWS that guess — alternating writing and drawing until the paper comes back. Compare the start and end and laugh at how it mutated!'
  }
};
