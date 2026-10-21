# ✏️ Hush Music Paper Games

A single-file game hub (`index.html`, ~161 KB, no build step) in the same family as
Hush Music Hand Games, Board Games and Show Games — same shell, bottom nav,
rooms, friends, chat and Profile → Setup flow, in **ink blue (`#58a6ff`) with
notebook-paper panels** (off-white paper, light blue ruling lines, red margin line)
inside every game.

## The 15 games

| # | Game | Modes | Notes |
|---|------|-------|-------|
| 1 | 🔲 Dots and Boxes | PvC · Pass & Play · Online | 4×4 boxes, claim = extra turn, sensible bot (takes boxes, avoids handing over 3rd sides) |
| 2 | ❌ Tic-Tac-Toe | PvC · Pass & Play · Online | Minimax bot (never loses) |
| 3 | 🪢 Hangman | PvC · Pass & Play · Online | 1,177-word bank, gallows drawn in 6 stages on the paper panel |
| 4 | 🌱 Sprouts | PvC · Pass & Play · Online | 3 starting dots, ≤3 lives per dot, no crossing lines (see simplifications) |
| 5 | ⬡ Sim | PvC · Pass & Play · Online | Hexagon; completing a triangle in YOUR color loses; bot avoids losing moves |
| 6 | 🐂 Bulls and Cows | PvC · Pass & Play · Online | 4 unique digits, bulls/cows scoring, 10 tries |
| 7 | 🔤 Categories | PvC · Pass & Play | Random letter, Name/Place/Animal/Thing/Food, 60 s, 10/5/0 scoring vs the bot's card |
| 8 | 🔮 MASH | Solo · Pass & Play | 4 options × 6 categories, magic number 3–10, counting elimination, story-card reveal |
| 9 | 🚫 Taboo | PvC · Pass & Play | 60 cards (target + 5 taboo + a clue using NONE of them — test-verified), 60 s rounds |
| 10 | 🔡 Crosswords | PvC · Pass & Play | 3 built-in 5×5 mini crosswords, numbered Across/Down clues, Check + Reveal |
| 11 | 🔎 Word Search | PvC · Pass & Play · Online | 10×10 grid, 8 hidden words (across/down/diagonal), tap first + last letter, timer |
| 12 | 👻 Ghost | PvC · Pass & Play · Online | 1,814-word dictionary, challenge rule, first to spell GHOST loses |
| 13 | 🪜 Word Ladders | PvC · Pass & Play | 20 puzzles, one-letter steps validated against a 1,161-word dictionary, par + hints |
| 14 | 📝 Consequences | PvC · Pass & Play | Fold-over story — your lines + the other side's secret lines, hidden until the reveal |
| 15 | 📞 Paper Telephone | PvC · Pass & Play | Write → draw → guess → draw chain with a drawing canvas, full chain reveal |

> Pictionary is deliberately **not** in this hub — it already lives in
> Hush Music Board Games.

Every game screen has a **📖 How to play** button with the official rules, boards sit
on lined notebook-paper panels, and quitting mid-game (Quit button, bottom nav,
browser/Android back) always asks **"Are you sure you want to quit?"** first.

## The works (hub features)

- **Accounts** — sign up / log in / log out / erase account. Demo mode stores
  accounts on this device (localStorage); each player gets a **player code**.
- **Demo login** — a demo account is seeded automatically in demo mode:
  username **demo**, password **demo1234** (player code DEMO42), plus a
  **🎮 One-tap demo login** button on the login screen. It is created on
  first run on each device and re-created if erased.
- **Points** — 1,000 starting points, **+500 daily bonus** (claim button on Home
  and Profile), points for every PvC win, **per-game W / L / T + win-rate %** on Profile.
- **Top 50 leaderboard** — seeded with 50 paper-themed rival bots plus you in demo
  mode; the shared board (from `pg_users`) when Firebase is connected.
- **Friends** — add by player code, friend requests with accept/decline, friends
  list. Demo mode: requests land in the other local account's inbox, and the
  seeded Top-50 rivals (codes shown on the leaderboard) accept after a beat.
- **Game rooms** — create/join with a 4-digit code per game plus a room browser.
  Demo rooms run on-device; with Firebase they are live rooms in `pg_rooms`.
- **Text chat** — lobby chat (bottom nav 💬) and an in-game chat box on every
  game screen (`pg_chats` when online, on-device in demo mode).
- **Voice talk** — 🎤 Join Voice Talk button in the lobby, in rooms and in every
  game. Uses the same Cloudflare token-worker pattern as the other hubs:
  paste the worker URL in **Profile → Setup**; the app fetches
  `GET <workerUrl>?room=<room>&identity=<username>` and expects JSON
  `{ "token": "…", "url": "wss://…" }` (a raw-text token plus the optional
  LiveKit server URL field in Setup also works). Mic mute is the 🎤 button in
  the header; game sounds mute is the 🔊 button. **No API secret is ever in
  this file** — the secret stays in the Cloudflare Worker.
- **Firebase adapter** — paste your web config JSON in **Profile → Setup**
  (stored in localStorage only, never baked in). Everything lives under a new
  RTDB namespace: `pg_users`, `pg_codes`, `pg_rooms`, `pg_leaderboard`,
  `pg_chats`, plus `pg_friends` / `pg_requests` for the friends system.
  The hub works **fully offline in demo mode** if the CDNs never load.

## Launch steps

1. Create a GitHub repo named **`hush-music-paper-games`** (github.com/hushmusicent).
2. Push this folder (`index.html`, `README.md`, `tests/`) to the repo's `main` branch.
3. Open the app in **Google AI Studio** and do the usual **Step 1 pull** from GitHub.
4. In the app: **Profile → Setup** → paste your Firebase web config JSON → Save
   (page reloads into online mode). Use the same Firebase project as your other hubs.
5. Still in **Profile → Setup**: paste your **LiveKit token-worker URL**
   (the same Cloudflare Worker as the Board/Show hubs works — rooms are named
   `paper-*` so they never collide).
6. Publish the `pg_*` RTDB rules below in Firebase Console → Realtime Database →
   Rules → Publish.
7. Test: two devices, same room code → game starts; 🎤 Join Voice Talk in the room.

## RTDB rules (publish these)

```json
{
  "rules": {
    "pg_users": {
      ".read": "auth != null",
      "$uid": { ".write": "auth != null && auth.uid === $uid" }
    },
    "pg_codes": {
      ".read": "auth != null",
      "$code": { ".write": "auth != null" }
    },
    "pg_rooms": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "pg_leaderboard": {
      ".read": "auth != null",
      "$uid": { ".write": "auth != null && auth.uid === $uid" }
    },
    "pg_chats": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "pg_friends": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null"
      }
    },
    "pg_requests": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null"
      }
    }
  }
}
```

## Tests

```bash
node tests/test.js
```

63 checks, all passing: script load (headless vm, no top-level errors), Dots and
Boxes claim/extra-turn/bot, Tic-Tac-Toe win lines + minimax win/block, Hangman
wrong counts, Bulls and Cows exact bulls/cows cases, Sim triangle detection,
Ghost completion + dictionary continuations, Word Ladder one-letter + dictionary
+ all 20 solution chains, Word Search placement on 25 random boards, Crossword
solution-grid consistency, Categories 10/5/0 scoring, MASH elimination for every
magic number 3–10, Taboo (all 60 clues token-checked to contain none of the
target/taboo words), Sprouts legal moves and degrees.
`node --check` on the extracted main script also passes, and a DOM-stub boot
check renders the login/home view with no errors.

## Honest simplifications

- **Sprouts** — real Sprouts is drawn with freehand curves. Here each move is a
  smooth two-part curve through the new dot (which sits at a fixed offset from
  the straight line between the endpoints; loops arc to the upper-right of the
  dot). Crossing detection is straight segment-intersection on those two parts —
  approximate, not full curve geometry.
- **Paper Telephone (bot turns)** — the computer's "drawings" are pre-made
  line-art doodles picked by matching a keyword in the phrase to the built-in
  drawing bank (no sketch recognition). The computer's guesses are plausible
  phrases from a phrase bank. Your drawings and guesses are fully real.
- **Categories validation** — when the starter word list has entries for the
  drawn letter, an answer must be on the list to score (plus the first-letter
  rule). When a letter has no list entries for a category, any alphabetic
  answer starting with the letter scores.
- **MASH** — the counting elimination counts within each category in turn
  (magic number applied per category) rather than one single count circling
  all categories together. Same fortune-telling result style, simpler math.
- **Hangman (PvC)** — the computer is the word-keeper and you are the guesser;
  it does not take guessing turns. In Pass & Play, two players alternate guesses
  against the same word.
- **Ghost challenges (PvC)** — when you challenge the computer it names a real
  continuation from the embedded dictionary if one exists; when it challenges
  you, you must type a full continuing word to prove it.
- **Online PvP** — the board/word games sync full state through `pg_rooms`
  (turn-based, last-writer-wins, same pattern as the Board hub). The party
  games (Categories, MASH, Consequences, Paper Telephone) are
  built first for PvC and Pass & Play; their rooms exist and share state, but
  they're best played in the same room.
