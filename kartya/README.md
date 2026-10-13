# Kártyázzunk! – 3. forduló

Megnyitás: `index.html` dupla kattintással (file://). Nincs szerver, nincs külső könyvtár.

## Fájlok – ki miért felel

| Fájl | Felelősség |
|---|---|
| `config.js` | konstansok: méretek, színek, értékek, fázisok |
| `card.js` | `Card`, `Deck` |
| `player.js` | `Player`: kéz + elvitt lapok + pontszám |
| `rules.js` | **a szabály** – tiszta függvények |
| `ai.js` | gépi döntés |
| `game.js` | állapotgép: ki jön, kör vége, játék vége |
| `render.js` | rajzolás + `Layout` (lapok helye) |
| `input.js` | kattintás → `game.humanPlays(card)` |
| `main.js` | összekötés, rajzolási ciklus |

Betöltési sorrend számít (`index.html`), mert nem ES modulok.

## TODO-k (feladatpont szerint)

- [ ] c – `Deck.shuffle()` (Fisher–Yates)
- [ ] e – `Rules.canBeat()`
- [ ] g – `Game.drawCards()`
- [ ] h – `Player.score`
- [ ] i – `AI.chooseLead()`, `AI.chooseResponse()` stratégia
- [ ] j – `Game.endGame()` győztes + pontok
- [ ] opcionális – kártyaképek, animáció
