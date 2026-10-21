# ✏️ Hush Music Paper Games (React + TypeScript)

A full-featured React application rewritten with Vite, TypeScript, and Tailwind CSS in the same family as Hush Music Hand Games, Board Games and Show Games — featuring ink blue (`#58a6ff`) aesthetics and **authentic notebook-paper panels** (off-white paper, light blue ruling lines, red margin line) inside every game.

## The 15 Games

| # | Game | Modes | Notes |
|---|------|-------|-------|
| 1 | 🔲 Dots and Boxes | PvC · Pass & Play · Online | 4×4 boxes, claim = extra turn, sensible bot (takes boxes, avoids handing over 3rd sides) |
| 2 | ❌ Tic-Tac-Toe | PvC · Pass & Play · Online | Minimax bot (optimal moves) |
| 3 | 🪢 Hangman | PvC · Pass & Play · Online | 1,177-word bank, gallows drawn in 6 stages on the paper panel |
| 4 | 🌱 Sprouts | PvC · Pass & Play · Online | 3 starting dots, ≤3 lives per dot, smooth curved lines with crossing detection |
| 5 | ⬡ Sim | PvC · Pass & Play · Online | Hexagon; completing a triangle in YOUR color loses; bot avoids losing moves |
| 6 | 🐂 Bulls and Cows | PvC · Pass & Play · Online | 4 unique digits, bulls/cows scoring, 10 tries table |
| 7 | 🔤 Categories | PvC · Pass & Play | Random letter, Name/Place/Animal/Thing/Food, 60 s, 10/5/0 scoring vs bot or opponent |
| 8 | 🔮 MASH | Solo · Pass & Play | 4 options × 6 categories, magic number 3–10, counting elimination, story-card reveal |
| 9 | 🚫 Taboo | PvC · Pass & Play | 60 cards (target + 5 taboo + clean clue), 60 s rounds, 5+ correct wins |
| 10 | 🔡 Crosswords | PvC · Pass & Play | 3 built-in 5×5 mini crosswords, numbered Across/Down clues, Check + Reveal |
| 11 | 🔎 Word Search | PvC · Pass & Play · Online | 10×10 grid, 8 hidden words (across/down/diagonal), tap first + last letter, timer |
| 12 | 👻 Ghost | PvC · Pass & Play · Online | 1,814-word dictionary, challenge & prove mechanic, first to spell GHOST loses |
| 13 | 🪜 Word Ladders | PvC · Pass & Play | 20 puzzles, one-letter steps validated against dictionary, par + hints |
| 14 | 📝 Consequences | PvC · Pass & Play | Fold-over story — your lines + the other side's secret lines, hidden until the reveal |
| 15 | 📞 Paper Telephone | PvC · Pass & Play | Write → draw → guess → draw chain with drawing canvas, full chain reveal |

Every game screen includes:
- **📖 How to play** button with the official rules
- **Quit confirmation modal** to prevent accidental exits
- **Audio effects** (synthesized Web Audio beeps, clicks, and win/lose tunes) with mute control
- **Lobby & In-game text chat** and **Voice talk** readiness bar
- **Player Code** and points payouts

## Hub Features

- **Accounts & Persistence**: On-device demo mode (localStorage with `pg_` namespace) with unique 6-character player code, starting points (1,000 ⭐), and **+500 ⭐ daily bonus**.
- **Top 50 Leaderboard**: Seeded with 50 paper-themed rival bots plus the player, ranked by points and wins.
- **Friends System**: Add players by code, incoming requests inbox with accept/decline, friendly bot acceptance simulation.
- **Rooms & PvP**: Demo rooms browser and 4-digit code room system.
- **Profile Record**: Full breakdown table showing W / L / T and Win % across all 15 games.
- **Firebase & LiveKit Setup**: Ready for optional Firebase and LiveKit token-worker configuration in Profile → Setup.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS & Notebook paper themes
