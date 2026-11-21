// Bot v4: v3 keresése ritkított lépésgenerálással (gyorsabb -> mélyebb) és hangolt, óvatosabb fenyegetés-súlyokkal.
const choose_action = (state) => {
  const FALLBACK = { choiceIndex: 0, row: 0, column: 0 };
  const clock = () => { try { return Date.now(); } catch (e) { return 0; } };
  const T0 = clock();
  const BUDGET = (typeof globalThis !== "undefined" && globalThis.__BOT_BUDGET) || 2200; // ms – bőven az 5 s-os keret alatt (teszteléshez felülírható)
  const NODE_CAP = 300000; // vészfék, ha az óra nem működne
  const TIMEOUT = {};

  try {
    const { width, height, content } = state.map;
    const POOL = state.pool;
    if (!POOL || !POOL.length) return FALLBACK;
    // Hangolt paraméterek (v3 elleni tükrözött meccseken mérve).
    const PW1 = 0.4; // a lépő játékos fenyegetésének súlya a levélben
    const PW2 = 0.2; // az ellenfél fenyegetésének súlya a levélben
    const PKIN = 6; // belső csomópontokban vizsgált lépések száma
    const PKROOT = 20; // a gyökérben vizsgált lépések száma
    const ID = { "": 0, p1: 1, p2: 2 };
    const ME = ID[state.player] || 1;
    const N = width * height;

    // Lapos pálya: fajta (0 üres, 1 torony, 2 lovag, 3 szikla), érték (magasság/erő), tulajdonos (0/1/2).
    const kind = new Array(N).fill(0);
    const val = new Array(N).fill(0);
    const own = new Array(N).fill(0);
    content.forEach((f) => {
      const i = f.row * width + f.column;
      kind[i] = f.type === "tower" ? 1 : f.type === "knight" ? 2 : 3;
      val[i] = f.height || f.strength || 0;
      own[i] = ID[f.owner] || 0;
    });

    // Szomszédlisták (8 irány, pályán belül).
    const NB = [];
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / width);
      const c = i % width;
      const list = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if ((dr || dc) && r + dr >= 0 && r + dr < height && c + dc >= 0 && c + dc < width) list.push((r + dr) * width + c + dc);
      }
      NB.push(list);
    }

    // Egy torony pontja "who" szemszögéből (+ övé, − ellenfélé, 0 blokkolt/semleges).
    const towerPts = (i, who) => {
      let p1 = 0;
      let p2 = 0;
      const h = val[i];
      for (const j of NB[i]) {
        const k = kind[j];
        if (k === 1 && val[j] > h) return 0;
        if (k === 2) { if (own[j] === 1) p1 += val[j]; else p2 += val[j]; }
      }
      const o = p1 > p2 ? 1 : p2 > p1 ? 2 : own[i];
      return o === 0 ? 0 : o === who ? h : -h;
    };

    // Változások [index, fajta, érték, tulajdonos] alkalmazása; a régi állapotot adja vissza.
    const put = (ch) => {
      const olds = [];
      for (const [i, k, v, o] of ch) { olds.push([i, kind[i], val[i], own[i]]); kind[i] = k; val[i] = v; own[i] = o; }
      return olds.reverse();
    };

    // Pontkülönbség-változás "who" szemszögéből (csak az érintett tornyokat számolja újra).
    const mark = new Array(N).fill(0);
    let stamp = 0;
    const aff = [];
    const delta = (ch, who) => {
      if (!ch.length) return 0;
      stamp++;
      aff.length = 0;
      for (const c of ch) {
        const i = c[0];
        if (mark[i] !== stamp) { mark[i] = stamp; aff.push(i); }
        for (const j of NB[i]) if (mark[j] !== stamp) { mark[j] = stamp; aff.push(j); }
      }
      let before = 0;
      for (const i of aff) if (kind[i] === 1) before += towerPts(i, who);
      const olds = put(ch);
      let after = 0;
      for (const i of aff) if (kind[i] === 1) after += towerPts(i, who);
      put(olds);
      return after - before;
    };

    // Teljes pontkülönbség "who" szemszögéből.
    const totalDiff = (who) => {
      let s = 0;
      for (let i = 0; i < N; i++) if (kind[i] === 1) s += towerPts(i, who);
      return s;
    };

    // Jelölt mezők (a gyökérben egyszer): figurák 2 sugarú környezete + néhány elszigetelt üres mező.
    const CAND = (() => {
      const near = new Array(N).fill(false);
      for (let i = 0; i < N; i++) if (kind[i] === 1 || kind[i] === 2) {
        near[i] = true;
        for (const j of NB[i]) { near[j] = true; for (const k of NB[j]) near[k] = true; }
      }
      const out = [];
      const iso = [];
      for (let i = 0; i < N; i++) {
        if (kind[i] === 3) continue;
        if (near[i]) out.push(i); else if (kind[i] === 0) iso.push(i);
      }
      const step = Math.max(1, Math.floor(iso.length / 6));
      for (let k = 0; k < iso.length && k / step < 6; k += step) out.push(iso[k]);
      return out;
    })();

    // "Pazarló" célmező: szikla (minden szerszám hatástalanul elhasználható rajta), ha van.
    const ROCK = (() => { for (let i = 0; i < N; i++) if (kind[i] === 3) return i; return -1; })();

    // Választás kulcsa az azonos elemek összevonásához.
    const KEY = POOL.map((p) => `${p.type}|${p.height || 0}|${p.strength || 0}`);

    // Lépések generálása "who" számára az aktuális készletből (idx = eredeti készletindexek listája).
    const gen = (who, idx) => {
      const seen = {};
      const moves = [];
      // Ritkítás: tornyokból csak a 3 legmagasabb, lovagokból a 2 legerősebb és a leggyengébb változat.
      const hs = [];
      const ss = [];
      for (const k of idx) {
        const p = POOL[k];
        if (p.type === "tower" && hs.indexOf(p.height) < 0) hs.push(p.height);
        if (p.type === "knight" && ss.indexOf(p.strength) < 0) ss.push(p.strength);
      }
      hs.sort((a, b) => b - a);
      ss.sort((a, b) => b - a);
      const keepH = hs.slice(0, 3);
      const keepS = ss.slice(0, 2).concat(ss.length > 2 ? [ss[ss.length - 1]] : []);
      for (let t = 0; t < idx.length; t++) {
        const key = KEY[idx[t]];
        if (seen[key]) continue;
        seen[key] = true;
        const p = POOL[idx[t]];
        if (p.type === "tower" && keepH.indexOf(p.height) < 0) continue;
        if (p.type === "knight" && keepS.indexOf(p.strength) < 0) continue;
        const tool = [];
        if (p.type === "tower") {
          for (const i of CAND) if (kind[i] === 0) tool.push({ t, i, ch: [[i, 1, p.height, who]] });
        } else if (p.type === "knight") {
          for (const i of CAND) if (kind[i] === 0 && NB[i].some((j) => kind[j] === 1)) tool.push({ t, i, ch: [[i, 2, p.strength, who]] });
          if (!tool.length) for (const i of CAND) if (kind[i] === 0) { tool.push({ t, i, ch: [[i, 2, p.strength, who]] }); break; }
        } else if (p.type === "conversion") {
          for (const i of CAND) if ((kind[i] === 1 || kind[i] === 2) && own[i] !== who) tool.push({ t, i, ch: [[i, kind[i], val[i], who]] });
        } else if (p.type === "meteorite") {
          for (const i of CAND) if (kind[i] === 1 || kind[i] === 2) tool.push({ t, i, ch: [[i, 3, 0, 0]] });
        } else if (p.type === "landslide") {
          // Védekező/blokkoló: azokat a földcsuszamlásokat tartjuk meg, amelyek a legtöbb torony melletti üres mezőt zárják le.
          let bestH = -1;
          let bestM = null;
          for (const i of CAND) {
            const cells = [i, ...NB[i]].filter((j) => kind[j] === 0);
            if (!cells.length) continue;
            let h = 0;
            for (const j of cells) for (const k of NB[j]) if (kind[k] === 1) h += val[k];
            if (h > bestH) { bestH = h; bestM = { t, i, ch: cells.map((j) => [j, 3, 0, 0]), d: 0 }; }
          }
          if (bestM) tool.push(bestM);
        }
        // Elhasználás hatás nélkül (szerszám elvétele az ellenfél elől).
        if (ROCK >= 0 && p.type !== "landslide") tool.push({ t, i: ROCK, ch: [] });
        else if (!tool.length && CAND.length) tool.push({ t, i: CAND[0], ch: [] });
        for (const m of tool) { if (m.d === undefined) m.d = delta(m.ch, who); moves.push(m); }
      }
      return moves;
    };

    // Lépésválogatás: a legjobb K azonnali nyereség szerint + minden szerszámtípus legjobbja.
    const pick = (moves, K) => {
      moves.sort((a, b) => b.d - a.d);
      const out = moves.slice(0, K);
      const has = {};
      out.forEach((m) => { has[m.t] = true; });
      for (const m of moves) if (!has[m.t]) { has[m.t] = true; out.push(m); }
      return out;
    };

    // Fenyegetés: mennyit nyerhet "who" a következő lépésével (konvertálás, meteorit, legerősebb lovag).
    const threat = (who, idx) => {
      let conv = false;
      let met = false;
      let maxK = 0;
      for (const k of idx) {
        const p = POOL[k];
        if (p.type === "conversion") conv = true;
        else if (p.type === "meteorite") met = true;
        else if (p.type === "knight" && p.strength > maxK) maxK = p.strength;
      }
      let best = 0;
      for (let i = 0; i < N; i++) {
        const k = kind[i];
        if (k === 1 || k === 2) {
          if (conv && own[i] !== who) { const d = delta([[i, k, val[i], who]], who); if (d > best) best = d; }
          if (met) { const d = delta([[i, 3, 0, 0]], who); if (d > best) best = d; }
        } else if (k === 0 && maxK && NB[i].some((j) => kind[j] === 1)) {
          const d = delta([[i, 2, maxK, who]], who);
          if (d > best) best = d;
        }
      }
      return best;
    };

    // Negamax alfa-bétával; "diff" a lépő játékos szemszögéből értendő.
    let nodes = 0;
    const search = (who, idx, depth, alpha, beta, diff) => {
      if (!idx.length) return diff; // a játék vége: pontos érték
      if ((++nodes & 7) === 0 && (clock() - T0 > BUDGET || nodes > NODE_CAP)) throw TIMEOUT;
      if (depth === 0) return diff + PW1 * threat(who, idx) - PW2 * threat(3 - who, idx);
      const moves = pick(gen(who, idx), PKIN);
      let best = -Infinity;
      for (const m of moves) {
        const olds = put(m.ch);
        const rest = idx.slice(0, m.t).concat(idx.slice(m.t + 1));
        const v = -search(3 - who, rest, depth - 1, -beta, -alpha, -(diff + m.d));
        put(olds);
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    };

    // Gyökér: iteratív mélyítés; mindig az utolsó teljesen lefutott mélység eredményét használjuk.
    const rootIdx = POOL.map((_, k) => k);
    const rootDiff = totalDiff(ME);
    let rootMoves = pick(gen(ME, rootIdx), PKROOT);
    if (!rootMoves.length) return FALLBACK;
    let bestMove = rootMoves[0];

    for (let depth = 1; depth <= rootIdx.length; depth++) {
      let alpha = -Infinity;
      let curBest = null;
      const scored = [];
      try {
        for (const m of rootMoves) {
          if (depth > 1 && clock() - T0 > BUDGET) throw TIMEOUT;
          const olds = put(m.ch);
          const rest = rootIdx.slice(0, m.t).concat(rootIdx.slice(m.t + 1));
          const v = -search(3 - ME, rest, depth - 1, -Infinity, -alpha, -(rootDiff + m.d));
          put(olds);
          scored.push([v, m]);
          if (v > alpha) { alpha = v; curBest = m; }
        }
      } catch (e) {
        if (e !== TIMEOUT) throw e;
        break; // félbemaradt mélység: marad az előző eredmény
      }
      if (curBest) bestMove = curBest;
      // Következő körben a jobbnak bizonyult lépéseket nézzük először (hatékonyabb vágás).
      scored.sort((a, b) => b[0] - a[0]);
      rootMoves = scored.map((s) => s[1]);
      if (clock() - T0 > BUDGET * 0.5) break; // a következő mélység úgysem férne bele
    }

    return { choiceIndex: bestMove.t, row: Math.floor(bestMove.i / width), column: bestMove.i % width };
  } catch (e) {
    return FALLBACK;
  }
};

if (typeof module !== "undefined") module.exports = { choose_action };
