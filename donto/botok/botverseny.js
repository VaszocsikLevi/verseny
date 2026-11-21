// Bot: kiválasztja a következő lépést (kapzsi értékelés + az ellenfél legjobb válaszának levonása).
const choose_action = (state) => {
  const now = () => { try { return Date.now(); } catch (e) { return 0; } };
  const t0 = now();
  const FALLBACK = { choiceIndex: 0, row: 0, column: 0 };

  try {
    const me = state.player;
    const opp = me === "p1" ? "p2" : "p1";
    const { width, height, content } = state.map;
    const pool = state.pool;

    // Pálya kétdimenziós tömbként (üres mező = null).
    const grid = Array.from({ length: height }, () => Array(width).fill(null));
    content.forEach((f) => { grid[f.row][f.column] = f; });

    const inside = (r, c) => r >= 0 && r < height && c >= 0 && c < width;
    const isFig = (x) => !!x && x.type !== "rock";
    const DIRS = [-1, 0, 1].flatMap((dr) => [-1, 0, 1].map((dc) => [dr, dc]));

    // Egy torony értéke "who" szemszögéből: +magasság ha övé, -magasság ha az ellenfélé, 0 ha semleges/blokkolt.
    const towerVal = (g, r, c, who) => {
      const t = g[r][c];
      let p1 = 0;
      let p2 = 0;
      for (const [dr, dc] of DIRS) {
        if (!dr && !dc) continue;
        const rr = r + dr;
        const cc = c + dc;
        if (!inside(rr, cc)) continue;
        const nb = g[rr][cc];
        if (!nb) continue;
        if (nb.type === "tower" && nb.height > t.height) return 0; // magasabb szomszéd blokkol
        if (nb.type === "knight") (nb.owner === "p1" ? (p1 += nb.strength) : (p2 += nb.strength));
      }
      const owner = p1 > p2 ? "p1" : p2 > p1 ? "p2" : t.owner; // döntetlennél az eredeti tulajdonos
      return owner === "" ? 0 : owner === who ? t.height : -t.height;
    };

    // Változások ideiglenes alkalmazása; visszaadja a régi cellákat (visszaállításhoz).
    const put = (g, changes) => changes.map(([r, c, nw]) => { const old = g[r][c]; g[r][c] = nw; return [r, c, old]; });

    // Pontkülönbség-változás "who" szemszögéből, csak az érintett tornyokra számolva.
    const delta = (g, changes, who) => {
      if (!changes.some(([r, c, nw]) => isFig(g[r][c]) || isFig(nw))) return 0;
      const coords = new Map();
      changes.forEach(([r, c]) => DIRS.forEach(([dr, dc]) => {
        if (inside(r + dr, c + dc)) coords.set((r + dr) * width + (c + dc), [r + dr, c + dc]);
      }));
      const sum = () => [...coords.values()].reduce((s, [r, c]) => s + (g[r][c] && g[r][c].type === "tower" ? towerVal(g, r, c, who) : 0), 0);
      const before = sum();
      const olds = put(g, changes);
      const after = sum();
      put(g, olds.reverse());
      return after - before;
    };

    // Szóba jöhető célmezők: figurák 2 sugarú környezete + néhány elszigetelt üres mező.
    const candidates = (g) => {
      const near = new Set();
      const isolated = [];
      g.forEach((row, r) => row.forEach((x, c) => {
        if (!isFig(x)) return;
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (inside(r + dr, c + dc)) near.add((r + dr) * width + (c + dc));
      }));
      const cells = [];
      g.forEach((row, r) => row.forEach((x, c) => {
        if (x && x.type === "rock") return;
        if (near.has(r * width + c)) cells.push([r, c]);
        else if (!x) isolated.push([r, c]);
      }));
      const step = Math.max(1, Math.floor(isolated.length / 4));
      isolated.filter((_, i) => i % step === 0).slice(0, 4).forEach((cell) => cells.push(cell));
      return cells;
    };

    // Az összes lehetséges lépés (azonos választások közül csak az első index) a változásaikkal.
    const gen = (g, pl, who) => {
      const first = new Map();
      pl.forEach((p, i) => { const k = `${p.type}|${p.height || 0}|${p.strength || 0}`; if (!first.has(k)) first.set(k, i); });
      const cells = candidates(g);
      const moves = [];
      first.forEach((i) => {
        const p = pl[i];
        cells.forEach(([r, c]) => {
          const cell = g[r][c];
          let changes = null;
          if ((p.type === "tower" || p.type === "knight") && !cell) {
            const fig = p.type === "tower" ? { row: r, column: c, type: "tower", height: p.height, owner: who } : { row: r, column: c, type: "knight", strength: p.strength, owner: who };
            changes = [[r, c, fig]];
          } else if (p.type === "landslide") {
            changes = DIRS.map(([dr, dc]) => [r + dr, c + dc]).filter(([rr, cc]) => inside(rr, cc) && !g[rr][cc]).map(([rr, cc]) => [rr, cc, { row: rr, column: cc, type: "rock" }]);
          } else if (p.type === "meteorite") {
            changes = [[r, c, { row: r, column: c, type: "rock" }]];
          } else if (p.type === "conversion" && isFig(cell) && cell.owner !== who) {
            changes = [[r, c, { ...cell, owner: who }]];
          }
          if (changes && changes.length) moves.push({ choiceIndex: i, row: r, column: c, changes });
        });
      });
      return moves;
    };

    // Első szint: minden lépés azonnali értéke.
    const moves = gen(grid, pool, me);
    if (!moves.length) return FALLBACK;
    moves.forEach((m) => { m.d = delta(grid, m.changes, me); });
    moves.sort((a, b) => b.d - a.d);

    // Második szint: a legjobb jelöltekre levonjuk az ellenfél legjobb válaszát.
    let best = moves[0];
    let bestTotal = -Infinity;
    for (const m of moves.slice(0, 6)) {
      if (now() - t0 > 2000) break;
      const olds = put(grid, m.changes);
      const rest = pool.filter((_, i) => i !== m.choiceIndex);
      const replies = rest.length ? gen(grid, rest, opp) : [];
      const oppBest = replies.reduce((mx, rm) => Math.max(mx, delta(grid, rm.changes, opp)), 0);
      put(grid, olds.reverse());
      const total = m.d - oppBest;
      if (total > bestTotal || (total === bestTotal && m.d > best.d)) { bestTotal = total; best = m; }
    }

    return { choiceIndex: best.choiceIndex, row: best.row, column: best.column };
  } catch (e) {
    return FALLBACK;
  }
};

if (typeof module !== "undefined") module.exports = { choose_action };