// Vezérlés: a játék menete, eseménykezelés, gépi lépések, visszajátszás.

const J = {
  kezdo: null, // { map, pool } – a játék kezdőállása
  lepesek: [], // [{ choiceIndex, row, column }]
  seed: null,
  gep: { p1: null, p2: null }, // null = ember, "gep" = a bot
  kivalasztott: null, // a kijelölt készletelem indexe
  hover: null, // [r, c] az egér alatti mező
  vj: null, // visszajátszás: { lepesek, poz, fut, idozito }
  gepToken: 0, // a függőben lévő gépi lépés azonosítója (visszavonásnál érvénytelenítjük)
  gondolkodik: false,
  vegeMutatva: false,
  allapot: null,
};

const aktualisLepesek = () => (J.vj ? J.vj.lepesek.slice(0, J.vj.poz) : J.lepesek);
const emberJon = () => !J.vj && !J.allapot.vege && !J.gep[J.allapot.kovetkezo] && !J.gondolkodik;
const jatekosNevek = () => ({
  p1: J.gep.p1 ? `Kék · ${GEP_NEV[J.gep.p1]}` : "Kék",
  p2: J.gep.p2 ? `Narancs · ${GEP_NEV[J.gep.p2]}` : "Narancs",
});

// ---------- rajzolás ----------

const frissit = () => {
  J.allapot = allapotSzamitas(J.kezdo, aktualisLepesek());
  const a = J.allapot;
  if (J.kivalasztott !== null && J.kivalasztott >= a.pool.length) J.kivalasztott = null;
  const emberLep = emberJon();
  if (!emberLep) J.kivalasztott = null;

  // Kiemelések és előnézet
  const racs = palyaRacs(a.map);
  const elem = J.kivalasztott !== null ? a.pool[J.kivalasztott] : null;
  let ervenyes = null;
  let erintett = null;
  let mutatottPalya = a.map;
  let elonezetPont = null;
  if (elem) {
    ervenyes = new Set();
    for (let r = 0; r < a.map.height; r++)
      for (let c = 0; c < a.map.width; c++)
        if (ervenyesCel(a.map, racs, elem, r, c, a.kovetkezo)) ervenyes.add(kulcs(r, c));
    if (J.hover && (ervenyes.has(kulcs(...J.hover)) || ervenyes.size === 0)) {
      const [r, c] = J.hover;
      erintett = new Set(erintettMezok(a.map, racs, elem, r, c).map(([x, y]) => kulcs(x, y)));
      mutatottPalya = egyLepes(a.map, elem, r, c, a.kovetkezo);
      elonezetPont = calculate_score(mutatottPalya);
    }
  }
  const utolsoLepes = a.naplo[a.naplo.length - 1];
  tablaRajzol(mutatottPalya, {
    ervenyes,
    erintett,
    utolso: utolsoLepes && !erintett ? kulcs(utolsoLepes.row, utolsoLepes.column) : null,
    kattinthato: !!elem,
  });
  keszletRajzol(a.pool, J.kivalasztott, emberLep);
  pontRajzol(a, { p1: J.gep.p1 ? GEP_NEV[J.gep.p1] : "", p2: J.gep.p2 ? GEP_NEV[J.gep.p2] : "" }, elonezetPont);
  naploRajzol(a.naplo, J.vj ? J.vj.poz - 1 : -1, !!J.vj);

  // Állapotsor
  let szoveg;
  if (a.vege) {
    const [x, y] = a.pont;
    szoveg = x === y ? `Vége, döntetlen · ${x} : ${y}` : `Vége, ${x > y ? "Kék" : "Narancs"} nyert · ${x} : ${y}`;
  } else if (J.gondolkodik) szoveg = `<span class="porgo"></span> ${jatekosNevek()[a.kovetkezo]} gondolkodik…`;
  else if (J.vj) szoveg = `Visszajátszás · ${JATEKOS_NEV[a.kovetkezo]} következik`;
  else if (J.gep[a.kovetkezo]) szoveg = `${jatekosNevek()[a.kovetkezo]} következik`;
  else szoveg = `<span class="potty ${a.kovetkezo}"></span><b>${JATEKOS_NEV[a.kovetkezo]}</b> következik · ${elem ? `${elemNev(elem)}, válassz mezőt` : "válassz elemet a készletből"}`;
  if (elem && ervenyes && ervenyes.size === 0) szoveg += " <span class=\"halk\">· nincs érvényes célpont, bármelyik mezőre kattintva hatás nélkül elhasználod</span>";
  $("allapotSor").innerHTML = `<span class="allapot-szoveg">${szoveg}</span><span class="seed">${J.seed !== null ? `pálya ${J.seed} · ` : ""}${a.map.width}×${a.map.height}</span>`;

  $("gombVissza").disabled = !!J.vj || utolsoEmberLepesHossz() === null;
  vjSavFrissit();

  if (!J.vj && a.vege && !J.vegeMutatva) {
    J.vegeMutatva = true;
    setTimeout(vegeMutat, 350);
  }
};

// ---------- lépések ----------

const lep = (lepes) => {
  J.lepesek.push(lepes);
  J.kivalasztott = null;
  J.hover = null;
  frissit();
  gepIndit();
};

// Ha gép következik, rövid szünet után (hogy a felület kirajzolódjon) lép.
const gepIndit = () => {
  if (J.vj || J.allapot.vege) return;
  if (!J.gep[J.allapot.kovetkezo]) return;
  const token = ++J.gepToken;
  J.gondolkodik = true;
  frissit();
  setTimeout(() => {
    if (token !== J.gepToken) return;
    const lepes = gepLepes(J.allapot);
    if (token !== J.gepToken) return;
    J.gondolkodik = false;
    lep(lepes);
  }, J.gep.p1 && J.gep.p2 ? 450 : 300);
};

const gepMegallit = () => {
  J.gepToken++;
  J.gondolkodik = false;
};

// Visszavonás: vissza az utolsó emberi lépés elé (gép elleni játékban a gép lépését is visszavonjuk).
const utolsoEmberLepesHossz = () => {
  for (let i = J.lepesek.length - 1; i >= 0; i--) if (!J.gep[i % 2 === 0 ? "p1" : "p2"]) return i;
  return null;
};
const visszavon = () => {
  const hossz = utolsoEmberLepesHossz();
  if (J.vj || hossz === null) return;
  gepMegallit();
  J.lepesek.length = hossz;
  J.kivalasztott = null;
  J.vegeMutatva = false;
  frissit();
};

// ---------- új játék ----------

const jatekInditas = (kezdo, gep, seed = null, lepesek = []) => {
  gepMegallit();
  vjLeallit();
  J.vj = null;
  J.kezdo = kezdo;
  J.lepesek = lepesek;
  J.seed = seed;
  J.gep = gep;
  J.kivalasztott = null;
  J.hover = null;
  // Már befejezett játék betöltésekor (pl. kilépés a visszajátszásból) ne ugorjon fel újra a "Vége" ablak.
  J.vegeMutatva = lepesek.length > 0 && allapotSzamitas(kezdo, lepesek).vege;
  document.body.classList.remove("vj-mod");
  frissit();
  gepIndit();
};

const ujJatekUrlapbol = () => {
  const u = $("ujJatekUrlap").elements;
  const szam = (x, alap) => (x.value === "" || isNaN(Number(x.value)) ? alap : Number(x.value));
  const seedSzoveg = u.seed.value.trim();
  const g = palyaGeneralas({
    width: szam(u.width, 12),
    height: szam(u.height, 10),
    keszletMeret: szam(u.keszlet, 24),
    semlegesTornyok: szam(u.tornyok, 7),
    sziklak: szam(u.sziklak, 8),
    seed: seedSzoveg === "" ? undefined : Number(seedSzoveg) || [...seedSzoveg].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7),
  });
  const gep = { p1: u.p1.value === "ember" ? null : u.p1.value, p2: u.p2.value === "ember" ? null : u.p2.value };
  jatekInditas({ map: g.map, pool: g.pool }, gep, g.seed);
};

// ---------- visszajátszás ----------

const vjInditas = (kezdo, lepesek) => {
  gepMegallit();
  vjLeallit();
  J.kezdo = kezdo;
  J.lepesek = [];
  J.seed = null;
  J.gep = { p1: null, p2: null };
  J.kivalasztott = null;
  J.vj = { lepesek, poz: 0, fut: false, idozito: null };
  document.body.classList.add("vj-mod");
  frissit();
};

const vjLeallit = () => {
  if (J.vj && J.vj.idozito) clearTimeout(J.vj.idozito);
  if (J.vj) { J.vj.fut = false; J.vj.idozito = null; }
};

const vjMax = () => Math.min(J.vj.lepesek.length, J.kezdo.pool.length);

const vjUgras = (poz) => {
  if (!J.vj) return;
  J.vj.poz = Math.max(0, Math.min(vjMax(), poz));
  frissit();
};

const vjLejatszasLepes = () => {
  if (!J.vj || !J.vj.fut) return;
  if (J.vj.poz >= vjMax()) { vjLeallit(); frissit(); return; }
  vjUgras(J.vj.poz + 1);
  J.vj.idozito = setTimeout(vjLejatszasLepes, Number($("vjSebesseg").value));
};

const vjMuvelet = (muvelet) => {
  if (!J.vj) return;
  if (muvelet !== "lejatszas") vjLeallit();
  switch (muvelet) {
    case "elso": vjUgras(0); break;
    case "elozo": vjUgras(J.vj.poz - 1); break;
    case "kovetkezo": vjUgras(J.vj.poz + 1); break;
    case "utolso": vjUgras(vjMax()); break;
    case "lejatszas":
      if (J.vj.fut) { vjLeallit(); frissit(); }
      else {
        if (J.vj.poz >= vjMax()) J.vj.poz = 0;
        J.vj.fut = true;
        vjLejatszasLepes();
      }
      break;
    case "folytat": {
      const lepesek = J.vj.lepesek.slice(0, J.vj.poz);
      jatekInditas(J.kezdo, { p1: null, p2: null }, null, lepesek);
      break;
    }
    case "kilep": {
      const lepesek = J.vj.lepesek.slice(0, vjMax());
      jatekInditas(J.kezdo, { p1: null, p2: null }, null, lepesek);
      break;
    }
  }
};

const vjSavFrissit = () => {
  $("visszajatszoSav").classList.toggle("rejtett", !J.vj);
  if (!J.vj) return;
  const max = vjMax();
  $("vjCsuszka").max = max;
  $("vjCsuszka").value = J.vj.poz;
  $("vjSzamlalo").textContent = `${J.vj.poz} / ${max}`;
  $("vjLejatszas").innerHTML = ikon(J.vj.fut ? "pause" : "play", 16);
};

// ---------- ablakok ----------

const vegeMutat = () => {
  if (!J.allapot.vege || J.vj) return;
  const [x, y] = J.allapot.pont;
  const n = jatekosNevek();
  $("vegeCim").textContent = x === y ? "Döntetlen" : `${x > y ? n.p1 : n.p2} nyert`;
  $("vegeSzoveg").innerHTML = `<span class="vege-sor"><span class="potty p1"></span>${n.p1}<b>${x}</b></span><span class="vege-sor"><span class="potty p2"></span>${n.p2}<b>${y}</b></span>`;
  $("vegeAblak").showModal();
};

const letoltes = (nev, szoveg) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([szoveg], { type: "application/json" }));
  a.download = nev;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

const exportal = () => {
  const lepesek = J.vj ? J.vj.lepesek : J.lepesek;
  letoltes(`tower-conquest-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`, jatekExport(J.kezdo, lepesek));
};

const importBeolvas = () => {
  $("importHiba").textContent = "";
  try {
    return jatekImport($("importSzoveg").value);
  } catch (e) {
    $("importHiba").textContent = `Hibás adat: ${e.message}`;
    return null;
  }
};

// ---------- események ----------

const esemenyek = () => {
  $("keszlet").addEventListener("click", (e) => {
    const k = e.target.closest(".kartya");
    if (!k || !emberJon()) return;
    const i = Number(k.dataset.i);
    J.kivalasztott = J.kivalasztott === i ? null : i;
    frissit();
  });

  $("tabla").addEventListener("click", (e) => {
    const m = e.target.closest(".mezo");
    if (!m || !emberJon() || J.kivalasztott === null) return;
    const r = Number(m.dataset.r);
    const c = Number(m.dataset.c);
    const a = J.allapot;
    const elem = a.pool[J.kivalasztott];
    const racs = palyaRacs(a.map);
    const ervenyes = ervenyesCel(a.map, racs, elem, r, c, a.kovetkezo);
    // Ha az elemnek egyáltalán nincs érvényes célja, bárhová "elhasználható" (a pálya nem változik).
    let nincsCel = true;
    for (let rr = 0; rr < a.map.height && nincsCel; rr++)
      for (let cc = 0; cc < a.map.width && nincsCel; cc++) if (ervenyesCel(a.map, racs, elem, rr, cc, a.kovetkezo)) nincsCel = false;
    if (!ervenyes && !nincsCel) return;
    lep({ choiceIndex: J.kivalasztott, row: r, column: c });
  });

  $("tabla").addEventListener("mouseover", (e) => {
    const m = e.target.closest(".mezo");
    if (!m) return;
    const r = Number(m.dataset.r);
    const c = Number(m.dataset.c);
    $("infoSor").textContent = cellaLeiras(J.allapot.map, r, c);
    if (J.kivalasztott !== null && (!J.hover || J.hover[0] !== r || J.hover[1] !== c)) {
      J.hover = [r, c];
      frissit();
    }
  });
  $("tabla").addEventListener("mouseleave", () => {
    $("infoSor").textContent = "Vigyd az egeret egy mezőre a részletekért";
    if (J.hover) { J.hover = null; frissit(); }
  });

  $("naplo").addEventListener("click", (e) => {
    const l = e.target.closest(".lepes");
    if (!l || !J.vj) return;
    vjLeallit();
    vjUgras(Number(l.dataset.i) + 1);
  });

  $("gombUj").addEventListener("click", () => $("ujJatekAblak").showModal());
  $("ujJatekAblak").addEventListener("close", () => { if ($("ujJatekAblak").returnValue === "ok") ujJatekUrlapbol(); });
  $("veletlenMeret").addEventListener("click", () => {
    const u = $("ujJatekUrlap").elements;
    const v = () => 8 + Math.floor(Math.random() * 13);
    u.width.value = v();
    u.height.value = v();
    const t = Number(u.width.value) * Number(u.height.value);
    u.tornyok.value = Math.round(t * 0.06);
    u.sziklak.value = Math.round(t * 0.07);
    u.keszlet.value = 2 * Math.round(t / 12);
  });

  $("gombVissza").addEventListener("click", visszavon);
  $("gombExport").addEventListener("click", exportal);
  $("gombSzabaly").addEventListener("click", () => $("szabalyAblak").showModal());
  $("gombImport").addEventListener("click", () => { $("importHiba").textContent = ""; $("importAblak").showModal(); });

  $("importFajl").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (f) $("importSzoveg").value = await f.text();
  });
  $("importVisszajatszas").addEventListener("click", () => {
    const adat = importBeolvas();
    if (!adat) return;
    if (adat.lepesek.length === 0) { $("importHiba").textContent = "Nincsenek lépések az adatokban – indíts rajta játékot."; return; }
    $("importAblak").close();
    vjInditas(adat.kezdo, adat.lepesek);
  });
  $("importJatek").addEventListener("click", () => {
    const adat = importBeolvas();
    if (!adat) return;
    $("importAblak").close();
    jatekInditas(adat.kezdo, { p1: null, p2: null }, null, []);
  });

  $("vegeAblak").addEventListener("close", () => {
    const v = $("vegeAblak").returnValue;
    if (v === "uj") $("ujJatekAblak").showModal();
    else if (v === "export") exportal();
    else if (v === "vj") vjInditas(J.kezdo, J.lepesek.slice());
  });

  $("visszajatszoSav").addEventListener("click", (e) => {
    const g = e.target.closest("[data-vj]");
    if (g) vjMuvelet(g.dataset.vj);
  });
  $("vjCsuszka").addEventListener("input", (e) => { vjLeallit(); vjUgras(Number(e.target.value)); });

  document.addEventListener("keydown", (e) => {
    if (document.querySelector("dialog[open]") || e.target.matches("input, textarea, select")) return;
    if (e.key === "Escape" && J.kivalasztott !== null) { J.kivalasztott = null; frissit(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); visszavon(); }
    else if (J.vj) {
      const map = { ArrowLeft: "elozo", ArrowRight: "kovetkezo", Home: "elso", End: "utolso", " ": "lejatszas" };
      if (map[e.key]) { e.preventDefault(); vjMuvelet(map[e.key]); }
    }
  });

  window.addEventListener("resize", () => J.allapot && cellaMeretBeallitas(J.allapot.map));
};

// ---------- indulás ----------

ikonokBeillesztese();
esemenyek();
{
  const g = palyaGeneralas({ width: 12, height: 10, keszletMeret: 24, semlegesTornyok: 7, sziklak: 8 });
  jatekInditas({ map: g.map, pool: g.pool }, { p1: null, p2: null }, g.seed);
}
