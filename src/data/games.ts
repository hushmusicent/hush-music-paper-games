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
      'Real newspaper-style crosswords in 10 tiers of 100: Tier 1 starts at 8×8 with about 24 clues, and every tier the grid grows and the Q&A count climbs — 10×10, 12×12, the 15×15 newspaper-daily size with ~70 clues, up to Tier 10 at 17×17 with 90+ clues and longer, harder answers. Puzzle #1000 is the Sunday finale: a giant 21×21 with 110 clues. Every letter is crossed by an Across and a Down answer. The checklist screen tracks you — finished puzzles earn a ✔️ and the count is saved on your device. Tap a square to pick its word (tap again to switch Across/Down), type letters, and use Check to mark right and wrong squares. Stuck? The answers are printed at the bottom of the puzzle, upside down, just like in the newspaper — flip your phone if you must peek! Revealing the answers finishes the round without checklist credit; solve the whole grid yourself to earn the ✔️ and the points.'
  },
  wordsearch: {
    id: 'wordsearch',
    name: 'Word Search',
    icon: '🔎✏️',
    desc: '1,000 hunts that keep getting bigger',
    p: [1, 2],
    payout: PAYOUTS.wordsearch,
    rules:
      '1,000 word searches in 10 tiers of 100, drawn from a bank of 94,205 words. Tier 1 is a friendly 12×12 with 16 words hiding across and down; every tier the grid grows, the word count climbs, and new hiding directions unlock — diagonals, then backwards words — up to Tier 10 at 36×36 with 105 words in all 8 directions. And puzzle #1000 is the finale: a giant 40×40 grid with 130 words to find. Every grid is sized to fit the page. Tap the FIRST letter of a word, then tap its LAST letter to circle it. Find every word to clear the puzzle and earn its ✔️ on the checklist (saved on your device). Your time is shown — faster is better! Revealing the words finishes the round without checklist credit.'
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
    p: [2, 2],
    payout: PAYOUTS.ladder,
    rules:
      'A race up the same ladder. Both players build on ONE shared chain, taking turns: change EXACTLY ONE letter to make a new real word (no repeats). Whoever plays the TARGET word first wins — and if you leave your opponent with no legal move, you win too. Before the race, pick a LEVEL from 1 to 10: the words get longer as the levels rise (3 letters at Level 1 up to 7 letters and the longest routes in the game at Level 10). Optional 30-SECOND TURN TIMER: run out of time and your turn passes to the other player.'
  },
  consequences: {
    id: 'consequences',
    name: 'Consequences',
    icon: '📝✏️',
    desc: 'The folded-paper story game',
    p: [1, 4],
    payout: PAYOUTS.consequences,
    rules:
      "The classic fold-over story — with a twist: every game deals a DIFFERENT storyline (12 in all — the classic meeting, a job interview, a space mission, a cooking show, a superhero showdown, a haunted house, a pirate treasure, a time-travel mix-up, and more), each with its own blanks. Players secretly write their lines with the paper folded so nobody sees the previous lines, then read the hilarious combined story at the big reveal. Don't like the story you drew? Hit Shuffle before anyone writes. Against the computer, it fills its lines from big themed dialogue banks, so its lines are different every game too."
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
