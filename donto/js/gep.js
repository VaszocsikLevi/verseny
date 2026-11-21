// Gépi játékos a webes játékhoz.
// - "konnyu": mohó, egy lépésre előre néz (a lépés utáni pontkülönbséget maximalizálja).
// - "nehez": a versenyre beküldött bot (botok/bot6.js → choose_action), rövidebb időkerettel.

// Egy lépés hatása az aktuális pályára, a simulate_game segítségével.
// A simulate_game mindig p1-gyel kezd, ezért p2 lépésénél egy üres (érvénytelen indexű) lépés előzi meg.
const egyLepes = (map, elem, row, column, jatekos) => {
  if (jatekos === "p1") return simulate_game({ map, pool: [elem], steps: [{ choiceIndex: 0, row, column }] });
  return simulate_game({
    map,
    pool: [{ type: "meteorite" }, elem],
    steps: [{ choiceIndex: -1, row: 0, column: 0 }, { choiceIndex: 0, row, column }],
  });
};

const pontKulonbseg = (map, jatekos) => {
  const [a, b] = calculate_score(map);
  return jatekos === "p1" ? a - b : b - a;
};

const mohoLepes = (allapot) => {
  const { map, pool, kovetkezo: en } = allapot;
  const racs = palyaRacs(map);
  let legjobb = null;
  let legjobbErtek = -Infinity;
  const latott = new Set();
  pool.forEach((elem, i) => {
    const azonosito = `${elem.type}|${elem.height || 0}|${elem.strength || 0}`;
    if (latott.has(azonosito)) return; // azonos elemeket csak egyszer vizsgálunk
    latott.add(azonosito);
    for (let r = 0; r < map.height; r++)
      for (let c = 0; c < map.width; c++) {
        if (!ervenyesCel(map, racs, elem, r, c, en)) continue;
        // A varázslatokat csak akkor érdemes elhasználni, ha tényleg javítanak; kis véletlen a változatosságért.
        const ertek = pontKulonbseg(egyLepes(map, elem, r, c, en), en) + Math.random() * 0.5 - (elem.type === "tower" || elem.type === "knight" ? 0 : 0.6);
        if (ertek > legjobbErtek) {
          legjobbErtek = ertek;
          legjobb = { choiceIndex: i, row: r, column: c };
        }
      }
  });
  return legjobb || { choiceIndex: 0, row: 0, column: 0 };
};

const GEP_NEV = { konnyu: "Gép (könnyű)", nehez: "Gép (nehéz)" };

const gepLepes = (szint, allapot) => {
  if (szint === "nehez" && typeof choose_action === "function") {
    globalThis.__BOT_BUDGET = 1500; // a felület miatt rövidebb gondolkodási idő, mint a szerveren
    try {
      return choose_action({ map: allapot.map, pool: allapot.pool, player: allapot.kovetkezo });
    } catch (e) {
      console.error(e);
    }
  }
  return mohoLepes(allapot);
};
