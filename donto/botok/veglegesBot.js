// Bot v8 = v7 + 3,0 s időkeret (a szerver lassabb: a v7 lépései ott ~40 ms-os helyi keresésnek felelnek meg) + sűrűbb időellenőrzés.
// Bot v7 = v6 + erősebb fenyegetés-súly (0,6/0,3; a v6 ellen két mérésben +7,8 és +6,9 pont/pár).
// Bot v6: v5 motor szélesebb kereséssel (gyökér 40, belső 12 lépés) – a verseny kis pályáihoz hangolva, 2,2 s/lépés.
// A verseny 1-2. körének pontos felállásán és valósághű véletlen kis pályákon tesztelve (tükrözött párok).
// Bot v5: gyors, inkrementális motor + átviteli tábla (Zobrist-TT) + iteratív mélyítés + pontos végjáték iteratív szélesítéssel.
// - A szomszédsági adatok (lovag-erőösszegek, szomszéd-torony maximum, szomszéd-figurák száma) gyorsítótárazva vannak, így egy
//   lépés pontkülönbség-változása O(1)..O(8) lépésben számolható, allokáció nélkül (v4-hez képest ~10-30x több csomópont/s).
// - Lépéssorrend: TT-lépés elöl, majd azonnali nyereség (+ kevés üres szomszéd = védettebb mező); minden elemfajtának marad lépése.
// - Pontos mód (<= EX megmaradt elem): először szűk lépéshalmazzal a játék végéig, utána a maradék időben egyre szélesebb
//   lépéshalmazzal újra (KW lépcsők); a legszélesebb körben minden csendes mező, meteorit üres mezőre és minden földcsuszamlás.
//   A TT generációt kap, így a szélesebb kör a szűkebb kör értékeit nem, csak a lépéseit használja.
// - Az értékek egész "centipont" egységben vannak (SC = 100). A hatástalan lépések (elem elvétele) a simulate_game szerinti
//   "érvénytelen célnál a pálya nem változik" szabályra épülnek (torony/lovag foglalt mezőre, konvertálás/meteorit sziklára).
// Minden segédnév egy függvényen belül van: a legfelső szinten csak a choose_action jelenik meg (nincs névütközés a futtatóval).
const choose_action = (() => {
  const SC = 100;
  const INF = 1000000000;
  const TIMEOUT = {};

  const mix1 = (x) => { x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); return x ^ (x >>> 16); };
  const mix2 = (x) => { x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d); x = Math.imul(x ^ (x >>> 12), 0x297a2d39); return x ^ (x >>> 15); };

  const makeBot = (state) => {
    const FALLBACK = { choiceIndex: 0, row: 0, column: 0 };
    const clock = () => { try { return Date.now(); } catch (e) { return 0; } };
    const T0 = clock();
    const G = typeof globalThis !== "undefined" ? globalThis : {};
    const P = {
      BUDGET: G.__BOT_BUDGET || 3000, // ms – az 5 s-os keret alatt; a szerver ~2-4x lassabb a tesztgépnél, ezért 2200 → 3000 (teszteléshez felülírható)
      PW1: 60, // a lépő játékos fenyegetésének súlya a levélben (0,6 pont; 40/20 → 60/30: +7,8 ±2,3 pont/pár kis pályán)
      PW2: 30, // az ellenfél fenyegetésének súlya a levélben (0,3 pont)
      KROOT: 40, // gyökérben vizsgált lépések száma (kis pályán 20→30: +6,6 ±1,8 pont/pár; 30→40: +4,0 ±3,0; 40→50: nincs javulás)
      KIN: 12, // belső csomópontokban vizsgált lépések száma (8→10→12 javított kis pályán, 16 már nem; nagy pályán nem ront)
      EX: 8, // ennyi vagy kevesebb megmaradt elemnél "pontos mód": keresés a játék végéig, majd iteratív szélesítés
      KW: [8, 12, 18, 28, 999], // szélesítési lépcsők (belső lépésszám); az utolsó minden lépésfajtát tartalmaz
      KROOTEX: 40, // gyökérben vizsgált lépések pontos módban
      WSTOP: 0.6, // új szélesítési kört csak ennyi elhasznált keret alatt kezdünk
      NTOW: 3, // ritkított módban megtartott torony-magasságok
      DEF: 0, // védekezési sorrend-bónusz (prioritás/pont); tükrözött A/B-ben DEF=8 rontott (−6,2 ±2,1 pont/pár), ezért kikapcsolva
      QUIET: 3, // csendes (nem érintkező) mezők száma elemenként
      STOP: 0.55, // ha egy mélység után ennyi időkeret elfogyott, nem kezdünk újat
      TTBITS: 16, // 64k bejegyzés (~0,9 MB): QuickJS-ben 2,2 s alatt ~20-30 ezer csomópont, ez bőven elég
      NODE_CAP: 3000000,
    };
    if (G.__BOT_P) for (const k in G.__BOT_P) P[k] = G.__BOT_P[k];

    const { width, height, content } = state.map;
    const POOL = state.pool;
    const ID = { "": 0, p1: 1, p2: 2 };
    const ME = ID[state.player] || 1;
    const OPP = 3 - ME;
    const N = width * height;

    // ---------- pálya ----------
    const kind = new Array(N).fill(0); // 0 üres, 1 torony, 2 lovag, 3 szikla
    const val = new Array(N).fill(0); // magasság / erő
    const own = new Array(N).fill(0); // 0 semleges, 1 p1, 2 p2
    const s1 = new Array(N).fill(0); // szomszédos p1-lovagok erőösszege
    const s2 = new Array(N).fill(0); // szomszédos p2-lovagok erőösszege
    const nm = new Array(N).fill(0); // szomszédos tornyok maximális magassága
    const adjF = new Array(N).fill(0); // szomszédos tornyok+lovagok száma
    const adjT = new Array(N).fill(0); // szomszédos tornyok száma
    for (let q = 0; q < content.length; q++) {
      const f = content[q];
      const i = f.row * width + f.column;
      kind[i] = f.type === "tower" ? 1 : f.type === "knight" ? 2 : 3;
      val[i] = kind[i] === 3 ? 0 : f.height || f.strength || 0;
      own[i] = kind[i] === 3 ? 0 : ID[f.owner] || 0;
    }
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

    // Zobrist-hash (kétszeres 32 bit): tábla-rész XOR, készlet-rész összeg.
    let H1 = 0;
    let H2 = 0;
    let HP1 = 0;
    let HP2 = 0;
    const zc1 = (i, k, v, o) => mix1(i * 128 + k * 32 + v * 3 + o + 77);
    const zc2 = (i, k, v, o) => mix2(i * 128 + k * 32 + v * 3 + o + 77);

    // A gyorsítótárak és a hash teljes újraszámolása a kezdőállapotból.
    const rebuild = () => {
      s1.fill(0); s2.fill(0); nm.fill(0); adjF.fill(0); adjT.fill(0);
      H1 = 0; H2 = 0;
      for (let i = 0; i < N; i++) {
        H1 ^= zc1(i, kind[i], val[i], own[i]);
        H2 ^= zc2(i, kind[i], val[i], own[i]);
        const k = kind[i];
        if (k !== 1 && k !== 2) continue;
        const nb = NB[i];
        for (let q = 0; q < nb.length; q++) {
          const j = nb[q];
          adjF[j]++;
          if (k === 2) { if (own[i] === 1) s1[j] += val[i]; else s2[j] += val[i]; } else { adjT[j]++; if (val[i] > nm[j]) nm[j] = val[i]; }
        }
      }
    };
    rebuild();

    // Egy mező cseréje a gyorsítótárak és a hash karbantartásával.
    const setCell = (i, k, v, o) => {
      const ok = kind[i];
      const ov = val[i];
      const oo = own[i];
      const nb = NB[i];
      const nbl = nb.length;
      H1 ^= zc1(i, ok, ov, oo) ^ zc1(i, k, v, o);
      H2 ^= zc2(i, ok, ov, oo) ^ zc2(i, k, v, o);
      if (ok === 2) { if (oo === 1) for (let q = 0; q < nbl; q++) s1[nb[q]] -= ov; else for (let q = 0; q < nbl; q++) s2[nb[q]] -= ov; }
      if (k === 2) { if (o === 1) for (let q = 0; q < nbl; q++) s1[nb[q]] += v; else for (let q = 0; q < nbl; q++) s2[nb[q]] += v; }
      const wasF = ok === 1 || ok === 2;
      const isF = k === 1 || k === 2;
      if (wasF !== isF) { const dl = isF ? 1 : -1; for (let q = 0; q < nbl; q++) adjF[nb[q]] += dl; }
      const wasT = ok === 1;
      const isT = k === 1;
      if (wasT !== isT) { const dl = isT ? 1 : -1; for (let q = 0; q < nbl; q++) adjT[nb[q]] += dl; }
      kind[i] = k; val[i] = v; own[i] = o;
      if ((wasT || isT) && !(wasT && isT && ov === v)) {
        for (let q = 0; q < nbl; q++) {
          const j = nb[q];
          const nj = NB[j];
          let m = 0;
          for (let r = 0; r < nj.length; r++) { const z = nj[r]; if (kind[z] === 1 && val[z] > m) m = val[z]; }
          nm[j] = m;
        }
      }
    };

    // ---------- elemfajták (azonos elemek összevonva) ----------
    // típus: 1 torony, 2 lovag, 3 konvertálás, 4 meteorit, 5 földcsuszamlás, 6 ismeretlen (csak hatástalan)
    const keyIdx = {};
    const KT = [];
    const KV = [];
    const KF = []; // első előfordulás a készletben (eredeti index)
    const cnt = [];
    for (let t = 0; t < POOL.length; t++) {
      const p = POOL[t];
      const type = p.type === "tower" ? 1 : p.type === "knight" ? 2 : p.type === "conversion" ? 3 : p.type === "meteorite" ? 4 : p.type === "landslide" ? 5 : 6;
      const v = type === 1 ? p.height : type === 2 ? p.strength : 0;
      const key = type * 100 + v;
      let ki = keyIdx[key];
      if (ki === undefined) { ki = KT.length; keyIdx[key] = ki; KT.push(type); KV.push(v); KF.push(t); cnt.push(0); }
      cnt[ki]++;
    }
    const NK = KT.length;
    const ZK1 = [];
    const ZK2 = [];
    for (let ki = 0; ki < NK; ki++) { ZK1.push(mix1(ki * 7919 + 12345)); ZK2.push(mix2(ki * 104729 + 54321)); }
    for (let ki = 0; ki < NK; ki++) { HP1 = (HP1 + Math.imul(ZK1[ki], cnt[ki])) | 0; HP2 = (HP2 + Math.imul(ZK2[ki], cnt[ki])) | 0; }
    let left = POOL.length;
    // rendezett kulcslisták (magasság/erő szerint csökkenő)
    const TOWK = [];
    const KNK = [];
    for (let ki = 0; ki < NK; ki++) { if (KT[ki] === 1) TOWK.push(ki); else if (KT[ki] === 2) KNK.push(ki); }
    TOWK.sort((a, b) => KV[b] - KV[a]);
    KNK.sort((a, b) => KV[b] - KV[a]);

    // ---------- pontozás ----------
    // Egy torony pontja "w" szemszögéből (+ övé, − ellenfélé, 0 blokkolt/semleges).
    const tp = (j, w) => {
      const h = val[j];
      if (nm[j] > h) return 0;
      const a = s1[j];
      const b = s2[j];
      const o = a > b ? 1 : b > a ? 2 : own[j];
      return o === 0 ? 0 : o === w ? h : -h;
    };
    const totalDiff = (w) => {
      let s = 0;
      for (let i = 0; i < N; i++) if (kind[i] === 1) s += tp(i, w);
      return s;
    };

    // Azonnali pontkülönbség-változás "w" szemszögéből (a gyorsítótárakból, a pálya módosítása nélkül).
    const dTower = (c, h, w) => {
      if (adjF[c] === 0) return h;
      let d = 0;
      if (nm[c] <= h) { const a = s1[c]; const b = s2[c]; const o = a > b ? 1 : b > a ? 2 : w; d = o === w ? h : -h; }
      if (adjT[c] > 0) {
        const nb = NB[c];
        for (let q = 0; q < nb.length; q++) { const j = nb[q]; if (kind[j] === 1 && val[j] < h) d -= tp(j, w); }
      }
      return d;
    };
    const dKnight = (c, s, w) => {
      if (adjT[c] === 0) return 0;
      let d = 0;
      const nb = NB[c];
      for (let q = 0; q < nb.length; q++) {
        const j = nb[q];
        if (kind[j] !== 1 || nm[j] > val[j]) continue;
        const a = s1[j] + (w === 1 ? s : 0);
        const b = s2[j] + (w === 2 ? s : 0);
        const o = a > b ? 1 : b > a ? 2 : own[j];
        d += (o === 0 ? 0 : o === w ? val[j] : -val[j]) - tp(j, w);
      }
      return d;
    };
    // Feltétel: kind[c] torony vagy lovag, own[c] !== w.
    const dConv = (c, w) => {
      if (kind[c] === 1) {
        if (nm[c] > val[c] || s1[c] !== s2[c]) return 0; // blokkolt, vagy a lovagok döntenek
        return val[c] - (own[c] === 0 ? 0 : -val[c]); // a torony eddig az ellenfélé/semleges, ezután az övé
      }
      const v = val[c];
      const nb = NB[c];
      let d = 0;
      for (let q = 0; q < nb.length; q++) {
        const j = nb[q];
        if (kind[j] !== 1 || nm[j] > val[j]) continue;
        const a = s1[j] + (w === 1 ? v : -v);
        const b = s2[j] + (w === 2 ? v : -v);
        const o = a > b ? 1 : b > a ? 2 : own[j];
        d += (o === 0 ? 0 : o === w ? val[j] : -val[j]) - tp(j, w);
      }
      return d;
    };
    // Feltétel: kind[c] torony vagy lovag.
    const dMeteor = (c, w) => {
      const nb = NB[c];
      let d = 0;
      if (kind[c] === 1) {
        const h = val[c];
        d = -tp(c, w);
        for (let q = 0; q < nb.length; q++) {
          const j = nb[q];
          if (kind[j] !== 1 || val[j] >= h || nm[j] !== h) continue; // c blokkolta-e j-t
          const nj = NB[j];
          let m = 0;
          for (let r = 0; r < nj.length; r++) { const z = nj[r]; if (z !== c && kind[z] === 1 && val[z] > m) m = val[z]; }
          if (m > val[j]) continue; // másik torony még blokkolja
          const a = s1[j];
          const b = s2[j];
          const o = a > b ? 1 : b > a ? 2 : own[j];
          d += o === 0 ? 0 : o === w ? val[j] : -val[j];
        }
        return d;
      }
      const v = val[c];
      const oc = own[c];
      for (let q = 0; q < nb.length; q++) {
        const j = nb[q];
        if (kind[j] !== 1 || nm[j] > val[j]) continue;
        const a = s1[j] - (oc === 1 ? v : 0);
        const b = s2[j] - (oc === 2 ? v : 0);
        const o = a > b ? 1 : b > a ? 2 : own[j];
        d += (o === 0 ? 0 : o === w ? val[j] : -val[j]) - tp(j, w);
      }
      return d;
    };
    // Általános: a (kulcs, mező) lépés azonnali nyeresége a valódi szabályok szerint (érvénytelen cél: 0).
    const dOf = (ki, c, w) => {
      const t = KT[ki];
      const k = kind[c];
      if (t === 1) return k === 0 ? dTower(c, KV[ki], w) : 0;
      if (t === 2) return k === 0 ? dKnight(c, KV[ki], w) : 0;
      if (t === 3) return (k === 1 || k === 2) && own[c] !== w ? dConv(c, w) : 0;
      if (t === 4) return k === 1 || k === 2 ? dMeteor(c, w) : 0;
      return 0;
    };

    // ---------- lépés végrehajtása / visszavonása ----------
    const uI = [];
    const uK = [];
    const uV = [];
    const uO = [];
    let ut = 0;
    const logSet = (i, k, v, o) => { uI[ut] = i; uK[ut] = kind[i]; uV[ut] = val[i]; uO[ut] = own[i]; ut++; setCell(i, k, v, o); };
    const undoTo = (mark) => { while (ut > mark) { ut--; setCell(uI[ut], uK[ut], uV[ut], uO[ut]); } };
    // A szimulátor szabályai szerint: érvénytelen célnál a pálya nem változik, az elem mégis elfogy.
    const applyMove = (ki, c, w) => {
      const t = KT[ki];
      const k = kind[c];
      if (t === 1) { if (k === 0) logSet(c, 1, KV[ki], w); }
      else if (t === 2) { if (k === 0) logSet(c, 2, KV[ki], w); }
      else if (t === 3) { if ((k === 1 || k === 2) && own[c] !== w) logSet(c, k, val[c], w); }
      else if (t === 4) { if (k !== 3) logSet(c, 3, 0, 0); }
      else if (t === 5) {
        const nb = NB[c];
        if (k === 0) logSet(c, 3, 0, 0);
        for (let q = 0; q < nb.length; q++) if (kind[nb[q]] === 0) logSet(nb[q], 3, 0, 0);
      }
      cnt[ki]--; left--;
      HP1 = (HP1 - ZK1[ki]) | 0; HP2 = (HP2 - ZK2[ki]) | 0;
    };
    const unapplyItem = (ki) => { cnt[ki]++; left++; HP1 = (HP1 + ZK1[ki]) | 0; HP2 = (HP2 + ZK2[ki]) | 0; };

    // ---------- jelölt mezők (a gyökérben egyszer) ----------
    const near = new Array(N).fill(false);
    for (let i = 0; i < N; i++) if (kind[i] === 1 || kind[i] === 2) {
      near[i] = true;
      const nb = NB[i];
      for (let q = 0; q < nb.length; q++) { const j = nb[q]; near[j] = true; const nj = NB[j]; for (let r = 0; r < nj.length; r++) near[nj[r]] = true; }
    }
    const empN = new Array(N).fill(0); // üres szomszédok száma a gyökérben (kevesebb = védettebb mező)
    for (let i = 0; i < N; i++) { let e = 0; const nb = NB[i]; for (let q = 0; q < nb.length; q++) if (kind[nb[q]] === 0) e++; empN[i] = e; }
    const CELLS = [];
    const iso = [];
    for (let i = 0; i < N; i++) {
      if (kind[i] === 3) continue;
      if (near[i]) CELLS.push(i); else if (kind[i] === 0) iso.push(i);
    }
    iso.sort((a, b) => empN[a] - empN[b] || a - b);
    const isoPick = {};
    for (let q = 0; q < iso.length && q < 4; q++) isoPick[iso[q]] = true;
    const stepIso = Math.max(1, Math.floor(iso.length / 3));
    for (let q = 0; q < iso.length; q += stepIso) isoPick[iso[q]] = true;
    for (let i = 0; i < N; i++) if (isoPick[i]) CELLS.push(i);
    const CL = CELLS.length;
    let OCC = -1; // foglalt mező (hatástalan lépés célpontja torony/lovag számára)
    let ROCK = -1; // szikla (hatástalan lépés célpontja minden szerszámnak)
    for (let i = 0; i < N; i++) { if (kind[i] !== 0 && OCC < 0) OCC = i; if (kind[i] === 3 && ROCK < 0) ROCK = i; }
    // földcsuszamlás-jelöltek: a gyökérbeli "torony-szomszédság" szerint legjobb mezők
    const LSC = (() => {
      const sc = [];
      for (let z = 0; z < CL; z++) {
        const c = CELLS[z];
        let h = 0;
        const cells = [c].concat(NB[c]);
        for (let q = 0; q < cells.length; q++) { const j = cells[q]; if (kind[j] !== 0) continue; const nj = NB[j]; for (let r = 0; r < nj.length; r++) if (kind[nj[r]] === 1) h += val[nj[r]]; }
        if (h > 0) sc.push([h, c]);
      }
      sc.sort((a, b) => b[0] - a[0]);
      return sc.slice(0, 6).map((x) => x[1]);
    })();

    // ---------- lépésgenerálás ----------
    // Puffer: legjobb K lépés (rendezve) + elemfajtánként a legjobb.
    const tK = [];
    const tC = [];
    const tD = [];
    const tP = [];
    let tn = 0;
    let Kcur = 6;
    const kbP = new Array(NK).fill(-INF);
    const kbC = new Array(NK).fill(-1);
    const kbD = new Array(NK).fill(0);
    let collect = false; // nagy K-nál: gyűjtés, a végén egyetlen rendezés (a beszúrás O(n·K) lenne)
    const push = (ki, c, d, pr) => {
      if (pr > kbP[ki]) { kbP[ki] = pr; kbC[ki] = c; kbD[ki] = d; }
      if (collect) { tK[tn] = ki; tC[tn] = c; tD[tn] = d; tP[tn] = pr; tn++; return; }
      let pos;
      if (tn < Kcur) pos = tn++;
      else if (pr > tP[tn - 1]) pos = tn - 1;
      else return;
      while (pos > 0 && tP[pos - 1] < pr) { tK[pos] = tK[pos - 1]; tC[pos] = tC[pos - 1]; tD[pos] = tD[pos - 1]; tP[pos] = tP[pos - 1]; pos--; }
      tK[pos] = ki; tC[pos] = c; tD[pos] = d; tP[pos] = pr;
    };
    const oK = [];
    const oC = [];
    const oD = [];
    // Védekezési térkép: az ellenfél (opp) mezőnkénti nyeresége a legerősebb lovaggal / a legmagasabb toronnyal (blokkolás).
    const defK = new Array(N).fill(0);
    const defB = new Array(N).fill(0);
    const defS = new Array(N).fill(0);
    let defNow = 0;
    const computeDef = (who) => {
      const opp = 3 - who;
      let mk = 0;
      let ht = 0;
      for (let ki = 0; ki < NK; ki++) { if (cnt[ki] === 0) continue; if (KT[ki] === 2 && KV[ki] > mk) mk = KV[ki]; else if (KT[ki] === 1 && KV[ki] > ht) ht = KV[ki]; }
      defNow++;
      for (let j = 0; j < N; j++) {
        if (kind[j] !== 1 || nm[j] > val[j]) continue;
        let dk = 0;
        if (mk > 0) {
          const a = s1[j] + (opp === 1 ? mk : 0);
          const b = s2[j] + (opp === 2 ? mk : 0);
          const o = a > b ? 1 : b > a ? 2 : own[j];
          dk = (o === 0 ? 0 : o === opp ? val[j] : -val[j]) - tp(j, opp);
        }
        const db = ht > val[j] ? tp(j, who) : 0; // a saját pontot adó torony blokkolása
        if (dk <= 0 && db <= 0) continue;
        const nb = NB[j];
        for (let q = 0; q < nb.length; q++) {
          const c = nb[q];
          if (kind[c] !== 0) continue;
          if (defS[c] !== defNow) { defS[c] = defNow; defK[c] = 0; defB[c] = 0; }
          if (dk > 0) defK[c] += dk;
          if (db > 0) defB[c] += db;
        }
      }
    };
    const defAt = (c) => (defS[c] === defNow ? (defK[c] > defB[c] ? defK[c] : defB[c]) : 0);
    const qa = []; // csendes mezők (nincs szomszéd figura), kevés üres szomszéd szerint
    const qb = []; // csendes mezők lovagnak (nincs szomszéd torony)

    // Lépéslista az "ply" szinten; visszatér a lépések számával. ttMove: kulcs*1024+mező vagy -1.
    let KX = P.KW[0]; // pontos módbeli belső lépésszám (szélesítéskor nő)
    let WIDE = false; // legszélesebb kör: minden csendes mező, meteorit üres mezőre, minden földcsuszamlás
    let GEN = 1; // TT-generáció: a szélesebb kör nem használja a szűkebb kör értékeit (csak a lépéseit)
    const gen = (who, ply, K, ttMove) => {
      const exact = left <= P.EX;
      const wide = WIDE && exact;
      tn = 0; Kcur = K; collect = K > 48;
      for (let ki = 0; ki < NK; ki++) kbP[ki] = -INF;
      // megtartott kulcsok
      const keepT = [];
      const keepN = [];
      if (exact) {
        for (let q = 0; q < TOWK.length; q++) if (cnt[TOWK[q]] > 0) keepT.push(TOWK[q]);
        for (let q = 0; q < KNK.length; q++) if (cnt[KNK[q]] > 0) keepN.push(KNK[q]);
      } else {
        for (let q = 0; q < TOWK.length && keepT.length < P.NTOW; q++) if (cnt[TOWK[q]] > 0) keepT.push(TOWK[q]);
        let last = -1;
        for (let q = 0; q < KNK.length; q++) if (cnt[KNK[q]] > 0) { if (keepN.length < 2) keepN.push(KNK[q]); last = KNK[q]; }
        if (last >= 0 && keepN.indexOf(last) < 0) keepN.push(last);
      }
      // csendes mezők (rendezett beszúrással)
      qa.length = 0; qb.length = 0;
      const Q = wide ? 99 : exact ? P.QUIET + 1 : P.QUIET;
      const hasT = keepT.length > 0;
      const hasN = keepN.length > 0;
      const DEF = P.DEF;
      if (DEF > 0) computeDef(who);
      for (let z = 0; z < CL; z++) {
        const c = CELLS[z];
        if (kind[c] !== 0) continue;
        const af = adjF[c];
        const at = adjT[c];
        if (af === 0) {
          if (qa.length < Q || empN[c] < empN[qa[qa.length - 1]]) { let p = qa.length < Q ? qa.length++ : qa.length - 1; while (p > 0 && empN[qa[p - 1]] > empN[c]) { qa[p] = qa[p - 1]; p--; } qa[p] = c; }
        }
        if (at === 0 && hasN) {
          if (qb.length < Q || empN[c] < empN[qb[qb.length - 1]]) { let p = qb.length < Q ? qb.length++ : qb.length - 1; while (p > 0 && empN[qb[p - 1]] > empN[c]) { qb[p] = qb[p - 1]; p--; } qb[p] = c; }
        }
        if (af === 0 && at === 0) continue; // csak csendes jelölt
        const bonus = 8 - empN[c] + (DEF > 0 ? DEF * defAt(c) : 0);
        if (hasT) for (let q = 0; q < keepT.length; q++) { const ki = keepT[q]; const d = dTower(c, KV[ki], who); push(ki, c, d, d * 16 + bonus); }
        if (hasN && at > 0) for (let q = 0; q < keepN.length; q++) { const ki = keepN[q]; const d = dKnight(c, KV[ki], who); push(ki, c, d, d * 16 + bonus); }
      }
      for (let q = 0; q < keepT.length; q++) { const ki = keepT[q]; for (let r = 0; r < qa.length; r++) { const c = qa[r]; push(ki, c, KV[ki], KV[ki] * 16 + 8 - empN[c]); } }
      for (let q = 0; q < keepN.length; q++) { const ki = keepN[q]; for (let r = 0; r < qb.length; r++) { const c = qb[r]; push(ki, c, 0, 8 - empN[c]); } }
      // szerszámok
      let kLand = -1;
      for (let ki = 0; ki < NK; ki++) {
        if (cnt[ki] === 0) continue;
        const t = KT[ki];
        if (t === 3) {
          for (let z = 0; z < CL; z++) { const c = CELLS[z]; const k = kind[c]; if ((k === 1 || k === 2) && own[c] !== who) { const d = dConv(c, who); push(ki, c, d, d * 16 + 4); } }
        } else if (t === 4) {
          for (let z = 0; z < CL; z++) { const c = CELLS[z]; const k = kind[c]; if (k === 1 || k === 2) { const d = dMeteor(c, who); push(ki, c, d, d * 16 + 4); } else if (wide && k === 0) push(ki, c, 0, -3); }
        } else if (t === 5) kLand = ki;
      }
      if (kLand >= 0 && wide) {
        // minden különböző hatású földcsuszamlás (az érintett üres mezők halmaza szerint)
        const seenL = {};
        for (let z = 0; z < CL; z++) {
          const c = CELLS[z];
          let key = 0;
          let ne = 0;
          if (kind[c] === 0) { key = (key + mix1(c + 1)) | 0; ne++; }
          const nb = NB[c];
          for (let q = 0; q < nb.length; q++) if (kind[nb[q]] === 0) { key = (key + mix1(nb[q] + 1)) | 0; ne++; }
          if (ne === 0 || seenL[key]) continue;
          seenL[key] = true;
          push(kLand, c, 0, -2);
        }
      } else if (kLand >= 0) {
        let bestH = 0;
        let bestC = -1;
        for (let q = 0; q < LSC.length; q++) {
          const c = LSC[q];
          let h = 0;
          if (kind[c] === 0) { const nj = NB[c]; for (let r = 0; r < nj.length; r++) if (kind[nj[r]] === 1) h += val[nj[r]]; }
          const nb = NB[c];
          for (let w = 0; w < nb.length; w++) { const j = nb[w]; if (kind[j] !== 0) continue; const nj = NB[j]; for (let r = 0; r < nj.length; r++) if (kind[nj[r]] === 1) h += val[nj[r]]; }
          if (h > bestH) { bestH = h; bestC = c; }
        }
        if (bestC >= 0) push(kLand, bestC, 0, -2);
      }
      // hatástalan lépések (szerszám elvétele az ellenfél elől)
      for (let ki = 0; ki < NK; ki++) {
        if (cnt[ki] === 0) continue;
        const t = KT[ki];
        if (t === 5) continue;
        if (t === 1 || t === 2) { if (t === 1 ? !hasT || keepT.indexOf(ki) < 0 : !hasN || keepN.indexOf(ki) < 0) continue; if (OCC >= 0) push(ki, OCC, 0, -1); }
        else if (t === 3 || t === 4) { if (ROCK >= 0) push(ki, ROCK, 0, -1); }
        else if (t === 6) { if (CL > 0) push(ki, CELLS[0], 0, -1); }
      }
      // kimenet
      const OK = oK[ply] || (oK[ply] = []);
      const OC = oC[ply] || (oC[ply] = []);
      const OD = oD[ply] || (oD[ply] = []);
      let n = 0;
      if (collect) {
        const ix = [];
        for (let q = 0; q < tn; q++) ix.push(q);
        ix.sort((a, b) => tP[b] - tP[a] || a - b);
        const lim = tn < K ? tn : K;
        for (let q = 0; q < lim; q++) { const x = ix[q]; OK[n] = tK[x]; OC[n] = tC[x]; OD[n] = tD[x]; n++; }
      } else for (let q = 0; q < tn; q++) { OK[n] = tK[q]; OC[n] = tC[q]; OD[n] = tD[q]; n++; }
      for (let ki = 0; ki < NK; ki++) {
        if (cnt[ki] === 0 || kbP[ki] === -INF) continue;
        let have = false;
        for (let q = 0; q < n; q++) if (OK[q] === ki) { have = true; break; }
        if (!have) { OK[n] = ki; OC[n] = kbC[ki]; OD[n] = kbD[ki]; n++; }
      }
      // TT-lépés előre
      if (ttMove >= 0 && n > 0) {
        const tki = (ttMove / 1024) | 0;
        const tc = ttMove - tki * 1024;
        if (tki < NK && cnt[tki] > 0 && tc < N) {
          let at = -1;
          for (let q = 0; q < n; q++) if (OK[q] === tki && OC[q] === tc) { at = q; break; }
          let d;
          if (at >= 0) { d = OD[at]; for (let q = at; q > 0; q--) { OK[q] = OK[q - 1]; OC[q] = OC[q - 1]; OD[q] = OD[q - 1]; } }
          else { d = dOf(tki, tc, who); for (let q = n; q > 0; q--) { OK[q] = OK[q - 1]; OC[q] = OC[q - 1]; OD[q] = OD[q - 1]; } n++; }
          OK[0] = tki; OC[0] = tc; OD[0] = d;
        }
      }
      return n;
    };

    // ---------- levélértékelés ----------
    // Fenyegetés: mennyit nyerhet "w" a következő lépésével (konvertálás, meteorit, legerősebb lovag).
    const stamp = new Array(N).fill(0);
    const acc = new Array(N).fill(0);
    const touched = [];
    let stampNow = 0;
    const threat = (w, hasConv, hasMet, maxK) => {
      let best = 0;
      if (hasConv || hasMet) {
        for (let c = 0; c < N; c++) {
          const k = kind[c];
          if (k !== 1 && k !== 2) continue;
          if (hasConv && own[c] !== w) { const d = dConv(c, w); if (d > best) best = d; }
          if (hasMet) { const d = dMeteor(c, w); if (d > best) best = d; }
        }
      }
      if (maxK > 0) {
        stampNow++;
        let tcount = 0;
        for (let j = 0; j < N; j++) {
          if (kind[j] !== 1 || nm[j] > val[j]) continue;
          const a = s1[j] + (w === 1 ? maxK : 0);
          const b = s2[j] + (w === 2 ? maxK : 0);
          const o = a > b ? 1 : b > a ? 2 : own[j];
          const dl = (o === 0 ? 0 : o === w ? val[j] : -val[j]) - tp(j, w);
          if (dl === 0) continue;
          const nb = NB[j];
          for (let q = 0; q < nb.length; q++) {
            const c = nb[q];
            if (kind[c] !== 0) continue;
            if (stamp[c] !== stampNow) { stamp[c] = stampNow; acc[c] = 0; touched[tcount++] = c; }
            acc[c] += dl;
          }
        }
        for (let q = 0; q < tcount; q++) if (acc[touched[q]] > best) best = acc[touched[q]];
      }
      return best;
    };
    const leaf = (who, diff) => {
      let hasConv = false;
      let hasMet = false;
      let maxK = 0;
      for (let ki = 0; ki < NK; ki++) {
        if (cnt[ki] === 0) continue;
        const t = KT[ki];
        if (t === 3) hasConv = true; else if (t === 4) hasMet = true; else if (t === 2 && KV[ki] > maxK) maxK = KV[ki];
      }
      let v = diff * SC;
      if (hasConv || hasMet || maxK > 0) v += ((P.PW1 * threat(who, hasConv, hasMet, maxK)) | 0) - ((P.PW2 * threat(3 - who, hasConv, hasMet, maxK)) | 0);
      return v;
    };

    // ---------- átviteli tábla ----------
    const TTN = 1 << P.TTBITS;
    const TTM = TTN - 1;
    let TT = G.__TC_TT5;
    if (!TT || TT.n !== TTN) {
      TT = { n: TTN, tk: new Int32Array(TTN), tv: new Int32Array(TTN), tm: new Int32Array(TTN), td: new Int8Array(TTN), tg: new Int8Array(TTN), tf: new Int8Array(TTN) };
      try { G.__TC_TT5 = TT; } catch (e) { /* nincs globális tár: hívásonként új tábla */ }
    } else TT.tf.fill(0);
    const tk = TT.tk;
    const tv = TT.tv;
    const tm = TT.tm;
    const td = TT.td;
    const tg = TT.tg;
    const tf = TT.tf; // 0 üres, 1 pontos, 2 alsó korlát, 3 felső korlát

    // ---------- keresés ----------
    let nodes = 0;
    let rootLeft = left;
    const search = (who, depth, alpha, beta, diff) => {
      if (left === 0) return diff * SC;
      if (((++nodes & 3) === 0 || left <= P.EX) && (clock() - T0 > P.BUDGET || nodes > P.NODE_CAP)) throw TIMEOUT; // 4 csomópontonként: kisebb túlfutás
      const eff = depth >= left ? 100 : depth;
      const h1 = (H1 ^ HP1) | 0;
      const slot = (H2 ^ HP2) & TTM;
      let ttMove = -1;
      if (tf[slot] !== 0 && tk[slot] === h1) {
        ttMove = tm[slot];
        if (tg[slot] === GEN && td[slot] >= eff) {
          const v = tv[slot];
          const f = tf[slot];
          if (f === 1) return v;
          if (f === 2) { if (v >= beta) return v; } else if (v <= alpha) return v;
        }
      }
      if (depth <= 0) {
        const v = leaf(who, diff);
        if (tf[slot] === 0 || td[slot] <= 0 || tg[slot] !== GEN) { tk[slot] = h1; tv[slot] = v; tm[slot] = -1; td[slot] = 0; tf[slot] = 1; tg[slot] = GEN; }
        return v;
      }
      const ply = rootLeft - left;
      const n = gen(who, ply, left <= P.EX ? KX : P.KIN, ttMove);
      if (n === 0) return diff * SC;
      const OK = oK[ply];
      const OC = oC[ply];
      const OD = oD[ply];
      const orig = alpha;
      let best = -INF;
      let bestMv = -1;
      for (let q = 0; q < n; q++) {
        const ki = OK[q];
        const c = OC[q];
        const mark = ut;
        applyMove(ki, c, who);
        const v = -search(3 - who, depth - 1, -beta, -alpha, -(diff + OD[q]));
        undoTo(mark);
        unapplyItem(ki);
        if (v > best) { best = v; bestMv = ki * 1024 + c; if (v > alpha) { alpha = v; if (alpha >= beta) break; } }
      }
      if (tf[slot] === 0 || tk[slot] !== h1 || td[slot] <= eff || tg[slot] !== GEN) {
        tk[slot] = h1; tv[slot] = best; tm[slot] = bestMv; td[slot] = eff; tg[slot] = GEN;
        tf[slot] = best <= orig ? 3 : best >= beta ? 2 : 1;
      }
      return best;
    };

    // ---------- gyökér ----------
    // Egy gyökérkör adott mélységre; visszaadja a legjobb indexet (vagy -1), a pontszámokat és hogy lejárt-e az idő.
    const rootPass = (depth, rK, rC, rD, order, rootDiff) => {
      let alpha = -INF;
      let cur = -1;
      const sc = new Array(rK.length).fill(-INF);
      let timedOut = false;
      try {
        for (let q = 0; q < order.length; q++) {
          const m = order[q];
          if (depth > 1 && clock() - T0 > P.BUDGET) throw TIMEOUT;
          const mark = ut;
          applyMove(rK[m], rC[m], ME);
          const v = -search(OPP, depth - 1, -INF, -alpha, -(rootDiff + rD[m]));
          undoTo(mark);
          unapplyItem(rK[m]);
          sc[m] = v;
          if (v > alpha) { alpha = v; cur = m; }
        }
      } catch (e) {
        if (e !== TIMEOUT) throw e;
        timedOut = true;
      }
      return { cur, sc, timedOut, alpha };
    };
    const sortBy = (order, sc) => { const o = order.slice(); o.sort((a, b) => sc[b] - sc[a]); return o; };

    const run = () => {
      if (!POOL || !POOL.length) return FALLBACK;
      rootLeft = left;
      const rootDiff = totalDiff(ME);
      const n0 = gen(ME, 0, left <= P.EX ? P.KROOTEX : P.KROOT, -1);
      if (n0 === 0) return FALLBACK;
      let rK = oK[0].slice(0, n0);
      let rC = oC[0].slice(0, n0);
      let rD = oD[0].slice(0, n0);
      let order = [];
      for (let q = 0; q < n0; q++) order.push(q);
      let bestK = rK[0];
      let bestC = rC[0];
      let doneDepth = 0;
      let widened = 0;
      // 1. iteratív mélyítés (szűk lépéshalmaz)
      for (let depth = 1; depth <= rootLeft; depth++) {
        const r = rootPass(depth, rK, rC, rD, order, rootDiff);
        if (r.cur >= 0) { bestK = rK[r.cur]; bestC = rC[r.cur]; } // félbemaradt mélységnél is: a PV után talált javulás megbízható
        if (r.timedOut) break;
        doneDepth = depth;
        order = sortBy(order, r.sc);
        if (depth >= rootLeft) break; // a játék végéig kiszámolva
        if (clock() - T0 > P.BUDGET * P.STOP) break; // a következő mélység úgysem férne bele
      }
      // 2. pontos mód: a végéig kiszámolt eredmény után egyre szélesebb lépéshalmazzal újra
      if (rootLeft <= P.EX && doneDepth >= rootLeft) {
        for (let w = 1; w < P.KW.length; w++) {
          if (clock() - T0 > P.BUDGET * P.WSTOP) break;
          GEN++; KX = P.KW[w]; WIDE = w === P.KW.length - 1;
          const n1 = gen(ME, 0, WIDE ? 999 : Math.max(P.KROOTEX, 2 * KX), bestK * 1024 + bestC);
          rK = oK[0].slice(0, n1); rC = oC[0].slice(0, n1); rD = oD[0].slice(0, n1);
          order = []; for (let q = 0; q < n1; q++) order.push(q);
          const r = rootPass(rootLeft, rK, rC, rD, order, rootDiff);
          if (r.cur >= 0) { bestK = rK[r.cur]; bestC = rC[r.cur]; }
          if (r.timedOut) break;
          widened = w;
        }
      }
      if (G.__BOT_STAT) G.__STAT = { depth: doneDepth, nodes, ms: clock() - T0, n: rootLeft, widened };
      return { choiceIndex: KF[bestK], row: Math.floor(bestC / width), column: bestC % width };
    };

    // Tesztekhez: belső függvények elérése.
    const _t = { N, kind, val, own, s1, s2, nm, adjF, adjT, dTower, dKnight, dConv, dMeteor, totalDiff, threat, setCell, tp, NB, rebuild, keyIdx, KT, KV, cnt, applyMove, unapplyItem, undoTo, logSet, getHash: () => [H1, H2, HP1, HP2], getUt: () => ut };
    return { run, _t };
  };

  const choose_action = (state) => {
    try {
      return makeBot(state).run();
    } catch (e) {
      return { choiceIndex: 0, row: 0, column: 0 };
    }
  };

  choose_action._makeBot = makeBot; // csak a tesztekhez
  return choose_action;
})();

if (typeof module !== "undefined") module.exports = { choose_action, _makeBot: choose_action._makeBot };
