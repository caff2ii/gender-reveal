# Case Reveal — Gender Reveal Party Game

This is a static GitHub Pages game for a shared Firebase Realtime Database.

## Setup

1. Create a Firebase Web app and paste its config into `config.js`.
2. Confirm the database contains the existing source content at `bingo_phrases`, `common_quiz`, `group_quiz`, `clues`, and `secret_gender`.
3. Deploy this folder to GitHub Pages. Open `host.html`, `display.html`, `admin.html`, and `secret.html` from that deployment.

`host.html` generates the QR from `new URL('index.html', window.location.href)`. It therefore follows the actual GitHub Pages repository path automatically, including project pages such as `/repository-name/`; no URL needs to be configured manually.

## Data model used by the game

`players/{id}`: `{ name, group, pin, score, clue_library, team, final_prediction }`.

`game_state`: current phase, question progress, current/drawn Bingo phrases, cutoff, winner, and reveal result. Reset clears only this node and `players`.

## Current delivery

The shared Firebase layer, safe reset behavior, player joining/PIN collision avoidance, automatic QR, phase controls, bingo draws, Game 3 team choice, final prediction and password-gated secret reveal are wired. The next implementation pass should add the full Game 1 quiz flow, per-player 3×3 boards and transactional Bingo completion/ranking, clue awarding at both settlement stages, and the final cinematic sequence.
