// Bot v2: azonnali pontnyereség mínusz a kockázat (a megmaradt készlet mennyire veszélyezteti a tornyaimat).
const choose_action = (state) => {
  const FALLBACK = { choiceIndex: 0, row: 0, column: 0 };

  try {
    const { width, height, content } = state.map;
    const pool = state.pool;
    const ID = { "": 0, p1: 1, p2: 2 };
    const me = ID[state.player];
    const opp = 3 - me;
    const N = width * height;

    // Lapos tömbök: fajta (0 üres, 1 torony, 2 lovag, 3 szikla), érték (magasság/erő), tulajdonos (0 semleges, 1 p1, 2 p2).
    const kind = Array(N).fill(0);
    const val = Array(N).fill(0);
    const own = Array(N).fill(0);
    content.forEach((f) => {
      const i = f.row * width + f.column;
      kind[i] = f.type === "tower" ? 1 : f.type === "knight" ? 2 : 3;
      val[i] = f.height || f.strength || 0;
      own[i] = ID[f.owner] || 0;
    });

    // Szomszédsági lista mezőnként (8 irány, pályán belül).
    const NB = Array.from({ length: N }, (_, i) => {
      const r = Math.floor(i / width);
      const c = i % width;
      const list = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if ((dr || dc) && r + dr >= 0 && r + dr < height && c + dc >= 0 && c + dc < width) list.push((r + dr) * width + (c + dc));
      }
      return list;
    });

    // Torony pontja "who" szemszögéből (+ha övé, -ha az ellenfélé, 0 ha blokkolt/semleges).
    const towerPts = (i, who) => {
      const p = [0, 0, 0];
      for (const j of NB[i]) {
        if (kind[j] === 1 && val[j] > val[i]) return 0;
        if (kind[j] === 2) p[own[j]] += val[j];
      }
      const o = p[1] > p[2] ? 1 : p[2] > p[1] ? 2 : own[i];
      return o === 0 ? 0 : o === who ? val[i] : -val[i];
    };

    // Változások [index, fajta, érték, tulajdonos] alkalmazása; visszaadja a régi állapotot.
    const put = (changes) => changes.map(([i, k, v, o]) => {
      const old = [i, kind[i], val[i], own[i]];
      kind[i] = k; val[i] = v; own[i] = o;
      return old;
    });

    // Pontkülönbség-változás "who" szemszögéből az érintett tornyokra.
    const delta = (changes, who) => {
      if (!changes.some(([i, k]) => k === 1 || k === 2 || kind[i] === 1 || kind[i] === 2)) return 0;
      const aff = new Set();
      changes.forEach(([i]) => { aff.add(i); NB[i].forEach((j) => aff.add(j)); });
      const sum = () => [...aff].reduce((s, i) => s + (kind[i] === 1 ? towerPts(i, who) : 0), 0);
      const before = sum();
      const olds = put(changes);
      const after = sum();
      put(olds.reverse());
      return after - before;
    };

    // Kockázat: mennyi pontot veszíthetek el a megmaradt készlet miatt (konvertálás, ellenséges lovag).
    const risk = (rest) => {
      const hasConv = rest.some((p) => p.type === "conversion");
      const maxKnight = rest.reduce((m, p) => (p.type === "knight" ? Math.max(m, p.strength) : m), 0);
      let total = 0;
      let top = 0;
      for (let i = 0; i < N; i++) {
        if (kind[i] !== 1) continue;
        const pts = towerPts(i, me);
        if (pts <= 0) continue;
        top = Math.max(top, pts);
        const free = NB[i].some((j) => kind[j] === 0);
        const mine = NB[i].reduce((s, j) => s + (kind[j] === 2 && own[j] === me ? val[j] : 0), 0);
        const theirs = NB[i].reduce((s, j) => s + (kind[j] === 2 && own[j] === opp ? val[j] : 0), 0);
        if (free && maxKnight + theirs > mine) total += pts * 0.35; // lovaggal elfoglalható
      }
      return total + (hasConv ? top * 0.5 : 0); // a legjobb tornyomat konvertálhatják
    };

    // Jelölt mezők: figurák 2 sugarú környezete + néhány elszigetelt üres mező.
    const cells = (() => {
      const near = new Set();
      for (let i = 0; i < N; i++) if (kind[i] === 1 || kind[i] === 2) { near.add(i); NB[i].forEach((j) => { near.add(j); NB[j].forEach((k) => near.add(k)); }); }
      const out = [];
      const iso = [];
      for (let i = 0; i < N; i++) {
        if (kind[i] === 3) continue;
        if (near.has(i)) out.push(i);
        else if (kind[i] === 0) iso.push(i);
      }
      const step = Math.max(1, Math.floor(iso.length / 4));
      return out.concat(iso.filter((_, k) => k % step === 0).slice(0, 4));
    })();

    // Lépések generálása (azonos választásból csak az első index).
    const first = new Map();
    pool.forEach((p, i) => { const k = `${p.type}|${p.height || 0}|${p.strength || 0}`; if (!first.has(k)) first.set(k, i); });
    const moves = [];
    first.forEach((ci) => {
      const p = pool[ci];
      cells.forEach((i) => {
        let ch = null;
        if (p.type === "tower" && kind[i] === 0) ch = [[i, 1, p.height, me]];
        else if (p.type === "knight" && kind[i] === 0) ch = [[i, 2, p.strength, me]];
        else if (p.type === "landslide") ch = [i, ...NB[i]].filter((j) => kind[j] === 0).map((j) => [j, 3, 0, 0]);
        else if (p.type === "meteorite") ch = [[i, 3, 0, 0]];
        else if (p.type === "conversion" && (kind[i] === 1 || kind[i] === 2) && own[i] !== me) ch = [[i, kind[i], val[i], me]];
        if (ch && ch.length) moves.push({ ci, i, ch });
      });
    });
    if (!moves.length) return FALLBACK;

    // Értékelés: azonnali nyereség, majd a legjobb jelöltekre a kockázatváltozás levonása.
    moves.forEach((m) => { m.d = delta(m.ch, me); });
    moves.sort((a, b) => b.d - a.d);
    const baseRisk = risk(pool);
    let best = moves[0];
    let bestScore = -Infinity;
    moves.slice(0, 12).forEach((m) => {
      const olds = put(m.ch);
      const rest = pool.filter((_, k) => k !== m.ci);
      const score = m.d - (risk(rest) - baseRisk);
      put(olds.reverse());
      if (score > bestScore) { bestScore = score; best = m; }
    });

    return { choiceIndex: best.ci, row: Math.floor(best.i / width), column: best.i % width };
  } catch (e) {
    return FALLBACK;
  }
};

if (typeof module !== "undefined") module.exports = { choose_action };
