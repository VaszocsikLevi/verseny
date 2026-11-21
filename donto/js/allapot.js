// Játékállapot: kezdő pálya + közös készlet + lépéssorozat.
// Az aktuális pályát mindig a szerveren ellenőrzött simulate_game (lepesszim.js) számolja ki a lépésekből,
// a pontokat pedig a calculate_score (pontszamito.js). Így a webes játék pontosan a verseny szabályai szerint működik.

const JATEKOSOK = ["p1", "p2"];
const JATEKOS_NEV = { p1: "Kék", p2: "Narancs", "": "Semleges" };

// ---------- segédek ----------

// Determinisztikus véletlenszám-generátor (mulberry32), hogy egy pálya a seed alapján újra előállítható legyen.
const veletlenGenerator = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const kulcs = (r, c) => `${r},${c}`;

const palyaRacs = (map) => new Map(map.content.map((f) => [kulcs(f.row, f.column), f]));

const palyanBelul = (map, r, c) => r >= 0 && r < map.height && c >= 0 && c < map.width;

// Egy mező 8 szomszédjának koordinátái (pályán belül).
const szomszedok = (map, r, c) => {
  const lista = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++)
      if ((dr || dc) && palyanBelul(map, r + dr, c + dc)) lista.push([r + dr, c + dc]);
  return lista;
};

const melyMasolat = (x) => JSON.parse(JSON.stringify(x));

// ---------- készletelem leírása ----------

const ELEM_NEV = {
  tower: "Torony",
  knight: "Lovag",
  landslide: "Földcsuszamlás",
  meteorite: "Meteorit",
  conversion: "Konvertálás",
};

const elemNev = (elem) => {
  if (!elem) return "?";
  if (elem.type === "tower") return `Torony ${elem.height}`;
  if (elem.type === "knight") return `Lovag ${elem.strength}`;
  return ELEM_NEV[elem.type] || elem.type;
};

// ---------- pálya-generátor ----------

// Véletlen pálya és közös készlet. A készlet mindig páros elemszámú, így mindkét játékos ugyanannyiszor lép.
const palyaGeneralas = (beallitas = {}) => {
  const seed = beallitas.seed ?? Math.floor(Math.random() * 1e9);
  const rnd = veletlenGenerator(seed);
  const egesz = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  const width = Math.min(20, Math.max(8, beallitas.width ?? egesz(8, 14)));
  const height = Math.min(20, Math.max(8, beallitas.height ?? egesz(8, 14)));
  const terulet = width * height;

  // Előre lehelyezett semleges tornyok és sziklák.
  const tornyokSzama = beallitas.semlegesTornyok ?? Math.round(terulet * 0.06);
  const sziklakSzama = beallitas.sziklak ?? Math.round(terulet * 0.07);
  const foglalt = new Set();
  const content = [];
  const uresMezo = () => {
    for (let proba = 0; proba < 1000; proba++) {
      const r = egesz(0, height - 1);
      const c = egesz(0, width - 1);
      if (!foglalt.has(kulcs(r, c))) {
        foglalt.add(kulcs(r, c));
        return [r, c];
      }
    }
    return null;
  };
  for (let i = 0; i < tornyokSzama; i++) {
    const m = uresMezo();
    if (m) content.push({ row: m[0], column: m[1], type: "tower", height: egesz(1, 9), owner: "" });
  }
  for (let i = 0; i < sziklakSzama; i++) {
    const m = uresMezo();
    if (m) content.push({ row: m[0], column: m[1], type: "rock" });
  }

  // Közös készlet: főleg tornyok, kevesebb lovag, néhány varázslat.
  let meret = beallitas.keszletMeret ?? 2 * egesz(10, 16);
  meret = Math.max(2, meret - (meret % 2));
  const pool = [];
  for (let i = 0; i < meret; i++) {
    const x = rnd();
    if (x < 0.52) pool.push({ type: "tower", height: egesz(1, 9) });
    else if (x < 0.8) pool.push({ type: "knight", strength: egesz(1, 5) });
    else if (x < 0.87) pool.push({ type: "landslide" });
    else if (x < 0.94) pool.push({ type: "meteorite" });
    else pool.push({ type: "conversion" });
  }

  return { seed, map: { width, height, content }, pool };
};

// ---------- állapot a lépések alapján ----------

// Visszajátssza a lépéseket: a pályát a simulate_game adja, a készletet és a naplót itt követjük
// (ugyanazzal a szabállyal: létező index → az elem kikerül; nem létező index → az első elem törlődik).
const allapotSzamitas = (kezdo, lepesek) => {
  const pool = kezdo.pool.map((p) => ({ ...p }));
  const naplo = [];
  for (let i = 0; i < lepesek.length && pool.length > 0; i++) {
    const jatekos = i % 2 === 0 ? "p1" : "p2";
    const { choiceIndex, row, column } = lepesek[i];
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= pool.length) {
      const [elveszett] = pool.splice(0, 1);
      naplo.push({ jatekos, elem: elveszett, row, column, ervenytelen: true });
      continue;
    }
    const [elem] = pool.splice(choiceIndex, 1);
    naplo.push({ jatekos, elem, row, column, ervenytelen: false });
  }
  const map = simulate_game({ map: kezdo.map, pool: kezdo.pool, steps: lepesek });
  const pont = calculate_score(map);
  const kovetkezo = naplo.length % 2 === 0 ? "p1" : "p2";
  return { map, pool, naplo, pont, kovetkezo, vege: pool.length === 0 };
};

// ---------- érvényes célmezők ----------

// Hová aktiválható / helyezhető az adott elem az adott játékos számára.
const ervenyesCel = (map, racs, elem, r, c, jatekos) => {
  if (!palyanBelul(map, r, c)) return false;
  const mezo = racs.get(kulcs(r, c));
  switch (elem.type) {
    case "tower":
    case "knight":
      return !mezo;
    case "landslide":
    case "meteorite":
      return true;
    case "conversion":
      return !!mezo && mezo.type !== "rock" && mezo.owner !== jatekos;
    default:
      return false;
  }
};

// Mely mezőket érinti a lépés (az előnézet kiemeléséhez).
const erintettMezok = (map, racs, elem, r, c) => {
  if (elem.type === "landslide")
    return [[r, c], ...szomszedok(map, r, c)].filter(([rr, cc]) => !racs.has(kulcs(rr, cc)));
  return [[r, c]];
};

// ---------- tornyok részletes értékelése (megjelenítéshez) ----------

// Minden toronyra: blokkolt-e, ki uralja a lovagok alapján, hány pontot ér.
// Ugyanazt a szabályt követi, mint a calculate_score; a végösszeget a calculate_score adja.
const toronyErtekeles = (map) => {
  const racs = palyaRacs(map);
  const eredmeny = new Map();
  for (const f of map.content) {
    if (f.type !== "tower") continue;
    const kozel = szomszedok(map, f.row, f.column).map(([r, c]) => racs.get(kulcs(r, c))).filter(Boolean);
    const magasabb = kozel.some((x) => x.type === "tower" && x.height > f.height);
    const ero = { p1: 0, p2: 0 };
    kozel.filter((x) => x.type === "knight" && ero[x.owner] !== undefined).forEach((k) => (ero[k.owner] += k.strength));
    let ural = f.owner;
    if (ero.p1 > ero.p2) ural = "p1";
    else if (ero.p2 > ero.p1) ural = "p2";
    eredmeny.set(kulcs(f.row, f.column), {
      blokkolt: magasabb,
      ural,
      elfoglalt: ural !== f.owner,
      ero,
      pont: magasabb || !ural ? 0 : f.height,
    });
  }
  return eredmeny;
};

// ---------- JSON export / import ----------

const jatekExport = (kezdo, lepesek) =>
  JSON.stringify({ map: kezdo.map, pool: kezdo.pool, steps: lepesek }, null, 2);

const palyaE = (x) => x && typeof x === "object" && Number.isInteger(x.width) && Number.isInteger(x.height) && Array.isArray(x.content);
const lepesNormalizalas = (s) => {
  const a = s && (s.action || s.choice || s.move || s);
  if (!a || typeof a !== "object") return null;
  const choiceIndex = a.choiceIndex ?? a.choice_index ?? a.index;
  const row = a.row ?? a.y;
  const column = a.column ?? a.col ?? a.x;
  if (choiceIndex === undefined) return null;
  return { choiceIndex: Number(choiceIndex), row: Number(row), column: Number(column) };
};

// Rugalmas beolvasás: megkeresi a pályát, a készletet és (ha van) a lépéseket bármilyen beágyazásban
// (pl. a szerver által mutatott meccs-adatokban).
const jatekImport = (szoveg) => {
  const adat = JSON.parse(szoveg);
  let map = null;
  let pool = null;
  let steps = null;
  const bejar = (x, melyseg) => {
    if (!x || typeof x !== "object" || melyseg > 6) return;
    if (!map && palyaE(x.map)) map = x.map;
    if (!map && palyaE(x.initialMap)) map = x.initialMap;
    if (!pool && Array.isArray(x.pool)) pool = x.pool;
    if (!steps) for (const k of ["steps", "moves", "actions", "history"]) if (Array.isArray(x[k])) { steps = x[k]; break; }
    for (const k in x) bejar(x[k], melyseg + 1);
  };
  if (palyaE(adat)) map = adat;
  bejar(adat, 0);
  if (!map) throw new Error("Nem található pálya (width, height, content) a JSON-ban.");
  if (!pool) throw new Error("Nem található közös készlet (pool) a JSON-ban.");
  const lepesek = (steps || []).map(lepesNormalizalas).filter(Boolean);
  return { kezdo: { map: melyMasolat(map), pool: melyMasolat(pool) }, lepesek };
};

if (typeof module !== "undefined")
  module.exports = { palyaGeneralas, allapotSzamitas, ervenyesCel, erintettMezok, toronyErtekeles, jatekExport, jatekImport, palyaRacs, kulcs, elemNev };
