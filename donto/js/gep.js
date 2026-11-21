// Gépi játékos a webes játékhoz: a versenyre beküldött bot (botok/apritoBot2.js → choose_action).

// Egy lépés hatása az aktuális pályára, a simulate_game segítségével (az előnézethez).
// A simulate_game mindig p1-gyel kezd, ezért p2 lépésénél egy üres (érvénytelen indexű) lépés előzi meg.
const egyLepes = (map, elem, row, column, jatekos) => {
  if (jatekos === "p1") return simulate_game({ map, pool: [elem], steps: [{ choiceIndex: 0, row, column }] });
  return simulate_game({
    map,
    pool: [{ type: "meteorite" }, elem],
    steps: [{ choiceIndex: -1, row: 0, column: 0 }, { choiceIndex: 0, row, column }],
  });
};

const GEP_NEV = { gep: "Gép" };

const gepLepes = (allapot) => {
  globalThis.__BOT_BUDGET = 1500; // a felület miatt rövidebb gondolkodási idő, mint a szerveren
  return choose_action({ map: allapot.map, pool: allapot.pool, player: allapot.kovetkezo });
};
