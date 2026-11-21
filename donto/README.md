# Döntő – Tower Conquest

Indítás: nyisd meg a `index.html`-t böngészőben (szerver nem kell).

## Fájlok

| Fájl | Mit csinál |
|---|---|
| `pontszamito.js` | `calculate_score` – kis feladat, a webes játék pontszámítása is ezt használja |
| `lepesszim.js` | `simulate_game` – kis feladat, a webes játék minden lépést ezzel hajt végre |
| `botok/` | a beküldött botok (`apritoBot2.js` a webes játék gépi ellenfele) |
| `js/allapot.js` | pálya-generátor, állapot a lépésekből, érvényes célmezők, JSON import/export |
| `js/gep.js` | gépi ellenfél (`apritoBot2.js` `choose_action`), lépés-előnézet |
| `js/rajzolas.js` | tábla, készlet, pontok, napló kirajzolása |
| `js/vezerles.js` | játékmenet, események, visszavonás, visszajátszás |

## Funkciók

- Kétszemélyes játék egy gépen, felváltva; élő pontszám, győztes kihirdetése.
- Előnézet: elem kijelölése után az egér alatti mezőn látszik a lépés hatása és a pontváltozás.
- Tornyok jelölése: arany keret = pontot ér (+érték), halvány = blokkolja magasabb szomszéd, ⚔ = lovagok elfoglalták.
- Új játék: pályaméret (8–20), készletméret, semleges tornyok, sziklák, seed (ugyanaz a seed = ugyanaz a pálya).
- Gépi játékos a saját botunkkal (`apritoBot2.js`), ember–gép és gép–gép módban is.
- Visszavonás (Ctrl+Z), gép ellen a gép lépését is visszavonja.
- Mentés JSON-be (`{map, pool, steps}`), visszajátszás bemásolt JSON-ból (szerveres meccsadat is), léptetés, lejátszás, „Folytatás innen”.
