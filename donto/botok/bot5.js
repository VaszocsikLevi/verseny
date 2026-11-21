// Tower Conquest bot – choose_action(state) -> {choiceIndex, row, column}
// Elv: pontos pontszámítás + beam-es minimax (iteratív mélyítés, időkorláttal)
// + védekezési (kitettségi) heurisztika a levélértékhez / döntetlen eldöntéséhez.

function choose_action(state) {
  var SAFETY_W = 0.3;     // kitettségi heurisztika súlya
  var TIME_LIMIT = 2000;  // ms
  var MAX_DEPTH = 8;

  var t0 = (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0;
  var hasClock = t0 > 0;
  var expansions = 0;
  var MAX_EXP = hasClock ? 100000 : 40;

  var map = state.map, pool = state.pool || [];
  var W = map.width, H = map.height, N = W * H;
  var me = state.player === 'p2' ? 2 : 1;
  var opp = 3 - me;

  function fallback() {
    return { choiceIndex: 0, row: 0, column: 0 };
  }
  if (!pool.length || !(N > 0)) return fallback();

  try {
    // ---- tábla: tp 0 üres, 1 torony, 2 lovag, 3 szikla
    var tp = new Uint8Array(N), val = new Uint8Array(N), own = new Uint8Array(N);
    var content = map.content || [];
    for (var q = 0; q < content.length; q++) {
      var o = content[q], r = o.row, c = o.column;
      if (!(r >= 0 && r < H && c >= 0 && c < W)) continue;
      var i = r * W + c;
      if (o.type === 'tower') { tp[i] = 1; val[i] = o.height; own[i] = o.owner === 'p1' ? 1 : (o.owner === 'p2' ? 2 : 0); }
      else if (o.type === 'knight') { tp[i] = 2; val[i] = o.strength; own[i] = o.owner === 'p1' ? 1 : 2; }
      else if (o.type === 'rock') { tp[i] = 3; }
    }
    var NB = new Array(N), N9 = new Array(N);
    for (var rr = 0; rr < H; rr++) {
      for (var cc = 0; cc < W; cc++) {
        var l = [];
        for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          var nr = rr + dr, nc = cc + dc;
          if (nr >= 0 && nr < H && nc >= 0 && nc < W) l.push(nr * W + nc);
        }
        var id = rr * W + cc;
        NB[id] = l;
        N9[id] = [id].concat(l);
      }
    }

    // ---- pontszámítás: egy torony előjeles értéke (p1 +, p2 -)
    function tv(i) {
      if (tp[i] !== 1) return 0;
      var h = val[i], s1 = 0, s2 = 0, nb = NB[i];
      for (var k = 0; k < nb.length; k++) {
        var j = nb[k], t = tp[j];
        if (t === 1) { if (val[j] > h) return 0; }
        else if (t === 2) { if (own[j] === 1) s1 += val[j]; else s2 += val[j]; }
      }
      var ow = own[i];
      if (s1 > s2) ow = 1; else if (s2 > s1) ow = 2;
      return ow === 1 ? h : (ow === 2 ? -h : 0);
    }
    function sumTV(c) {
      var a = N9[c], s = 0;
      for (var k = 0; k < a.length; k++) s += tv(a[k]);
      return s;
    }
    function fullScore() {
      var s = 0;
      for (var i = 0; i < N; i++) if (tp[i] === 1) s += tv(i);
      return s;
    }

    // ---- készlet csoportosítva
    var groups = [], gmap = {};
    for (var pi = 0; pi < pool.length; pi++) {
      var p = pool[pi];
      var v = p.type === 'tower' ? p.height : (p.type === 'knight' ? p.strength : 0);
      var key = p.type + ':' + v;
      var g = gmap[key];
      if (!g) { g = { kind: p.type, v: v, idxs: [], count: 0 }; gmap[key] = g; groups.push(g); }
      g.idxs.push(pi); g.count++;
    }
    var counts = groups.map(function (g) { return g.count; });

    // ---- lépés alkalmazás / visszavonás
    var stk = [];
    function setCell(i, t, v, o) { stk.push(i, tp[i], val[i], own[i]); tp[i] = t; val[i] = v; own[i] = o; }
    function undoTo(mark) {
      while (stk.length > mark) {
        var o = stk.pop(), v = stk.pop(), t = stk.pop(), i = stk.pop();
        own[i] = o; val[i] = v; tp[i] = t;
      }
    }
    // visszaadja az S (p1 - p2) változását
    function doMove(kind, v, c, mover) {
      if (c < 0) return 0;
      if (kind === 'landslide') {
        var a = N9[c];
        for (var k = 0; k < a.length; k++) if (tp[a[k]] === 0) setCell(a[k], 3, 0, 0);
        return 0;
      }
      var before = sumTV(c);
      if (kind === 'tower') setCell(c, 1, v, mover);
      else if (kind === 'knight') setCell(c, 2, v, mover);
      else if (kind === 'meteorite') setCell(c, 3, 0, 0);
      else if (kind === 'conversion') setCell(c, tp[c], val[c], mover);
      return sumTV(c) - before;
    }
    function emptyNb(c) {
      var n = 0, nb = NB[c];
      for (var k = 0; k < nb.length; k++) if (tp[nb[k]] === 0) n++;
      return n;
    }

    // ---- kitettségi heurisztika (nagyobb = jobb nekem)
    function safetyTerm() {
      var knightLeft = false, maxTower = 0;
      for (var gi = 0; gi < groups.length; gi++) {
        if (counts[gi] <= 0) continue;
        var g = groups[gi];
        if (g.kind === 'knight') knightLeft = true;
        else if (g.kind === 'tower' && g.v > maxTower) maxTower = g.v;
      }
      var mine = 0, theirs = 0;
      for (var i = 0; i < N; i++) {
        if (tp[i] !== 1) continue;
        var s = tv(i);
        if (s === 0) continue;
        var h = val[i];
        if (!(knightLeft || maxTower > h)) continue;
        var e = emptyNb(i);
        if (e === 0) continue;
        var ex = h * Math.min(e, 3) / 3;
        if ((s > 0 ? 1 : 2) === me) mine += ex; else theirs += ex;
      }
      var t = SAFETY_W * (0.5 * theirs - mine);
      return t > 3 ? 3 : (t < -3 ? -3 : t);
    }

    // ---- lépésgenerálás (beam)
    function genMoves(mover, K, M) {
      var sgn = mover === 1 ? 1 : -1, all = [];
      for (var gi = 0; gi < groups.length; gi++) {
        if (counts[gi] <= 0) continue;
        var g = groups[gi], list = [], kind = g.kind;
        if (kind === 'tower' || kind === 'knight') {
          for (var c = 0; c < N; c++) {
            if (tp[c] !== 0) continue;
            var mark = stk.length;
            var d = doMove(kind, g.v, c, mover);
            undoTo(mark);
            var key = sgn * d;
            if (kind === 'tower') key += 0.02 * (8 - emptyNb(c));
            list.push([key, gi, c, sgn * d]);
          }
        } else if (kind === 'meteorite' || kind === 'conversion') {
          for (var c2 = 0; c2 < N; c2++) {
            var t = tp[c2];
            if (t !== 1 && t !== 2) continue;
            if (kind === 'conversion' && own[c2] === mover) continue;
            var mark2 = stk.length;
            var d2 = doMove(kind, 0, c2, mover);
            undoTo(mark2);
            list.push([sgn * d2, gi, c2, sgn * d2]);
          }
        }
        if (list.length === 0 || kind === 'landslide' || kind === 'meteorite') list.push([0, gi, -1, 0]);
        list.sort(function (a, b) { return b[0] - a[0]; });
        var lim = Math.min(list.length, M);
        for (var k = 0; k < lim; k++) all.push(list[k]);
      }
      all.sort(function (a, b) { return b[0] - a[0]; });
      return all.length > K ? all.slice(0, K) : all;
    }

    function meVal(S) { return me === 1 ? S : -S; }
    function leaf(S, remaining) {
      var v = meVal(S);
      if (remaining === 0) return v + (v > 0 ? 1000 : (v < 0 ? -1000 : 0));
      return v;
    }

    function search(depth, mover, remaining, S, Kin, alpha, beta) {
      if (remaining === 0 || depth === 0) return leaf(S, remaining);
      if (++expansions > MAX_EXP || (hasClock && Date.now() - t0 > TIME_LIMIT)) throw 'abort';
      var last = depth === 1;
      var moves = genMoves(mover, last ? 1000 : Kin, last ? 1 : 4);
      var maxing = mover === me;
      var best = maxing ? -1e9 : 1e9;
      for (var k = 0; k < moves.length; k++) {
        var m = moves[k], g = groups[m[1]];
        var mark = stk.length;
        var d = doMove(g.kind, g.v, m[2], mover);
        counts[m[1]]--;
        var val_ = search(depth - 1, 3 - mover, remaining - 1, S + d, Kin, alpha, beta);
        counts[m[1]]++;
        undoTo(mark);
        if (maxing) { if (val_ > best) best = val_; if (best > alpha) alpha = best; }
        else { if (val_ < best) best = val_; if (best < beta) beta = best; }
        if (alpha >= beta) break;
      }
      return best;
    }

    // ---- gyökér
    var R = pool.length;
    var S0 = fullScore();
    var ROOT_K = 12;
    var cands = genMoves(me, ROOT_K + 6, 4);

    // helyzeti lépések (földcsuszamlás / meteorit üres mezőre): legjobb célpontok a kitettség alapján
    var near = new Uint8Array(N);
    for (var ti = 0; ti < N; ti++) if (tp[ti] === 1) {
      var a2 = N9[ti];
      for (var x = 0; x < a2.length; x++) {
        var a3 = N9[a2[x]];
        for (var y = 0; y < a3.length; y++) near[a3[y]] = 1;
      }
    }
    for (var ci = 0; ci < cands.length; ci++) {
      var cd = cands[ci], gk = groups[cd[1]].kind;
      if (cd[2] !== -1 || (gk !== 'landslide' && gk !== 'meteorite')) continue;
      var bestC = -1, bestS = -1e9;
      counts[cd[1]]--;
      for (var c3 = 0; c3 < N; c3++) {
        if (!near[c3]) continue;
        if (gk === 'meteorite' && tp[c3] !== 0) continue;
        if (gk === 'landslide' && tp[c3] === 3) continue;
        var mk = stk.length;
        doMove(gk, 0, c3, me);
        var sv = safetyTerm();
        undoTo(mk);
        if (sv > bestS) { bestS = sv; bestC = c3; }
      }
      counts[cd[1]]++;
      if (bestC < 0) {
        for (var c4 = 0; c4 < N; c4++) if (tp[c4] !== 3) { bestC = c4; break; }
      }
      cd[2] = bestC < 0 ? 0 : bestC;
    }
    // ismétlődő gyökér-jelöltek kiszűrése
    var seen = {}, uniq = [];
    for (var u = 0; u < cands.length; u++) {
      var kk = cands[u][1] + ':' + cands[u][2];
      if (seen[kk]) continue;
      seen[kk] = 1; uniq.push(cands[u]);
    }
    cands = uniq.slice(0, ROOT_K + 4);

    var chosen = cands[0];
    var order = cands;
    var maxD = Math.min(R, MAX_DEPTH);
    for (var D = 1; D <= maxD; D++) {
      var res = [];
      try {
        var Kin = Math.max(2, 7 - D);
        for (var mi = 0; mi < order.length; mi++) {
          var m = order[mi], g = groups[m[1]];
          var mark = stk.length;
          var d = doMove(g.kind, g.v, m[2], me);
          counts[m[1]]--;
          var vv;
          try {
            vv = search(D - 1, opp, R - 1, S0 + d, Kin, -1e9, 1e9);
          } finally {
            // abort esetén is konzisztens maradjon a szám
          }
          var sf = safetyTerm();
          counts[m[1]]++;
          undoTo(mark);
          res.push({ m: m, tot: vv + sf, key: m[0] });
        }
      } catch (e) {
        if (e !== 'abort') throw e;
        break;
      }
      res.sort(function (a, b) { return (b.tot - a.tot) || (b.key - a.key); });
      chosen = res[0].m;
      order = res.map(function (x) { return x.m; });
      if (hasClock && Date.now() - t0 > TIME_LIMIT / 3) break;
    }

    var cg = groups[chosen[1]];
    var cell = chosen[2] < 0 ? 0 : chosen[2];
    return { choiceIndex: cg.idxs[0], row: Math.floor(cell / W), column: cell % W };
  } catch (err) {
    return fallback();
  }
}
