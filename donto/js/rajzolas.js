// Megjelenítés: tábla, készlet, pontok, napló. Csak rajzol, állapotot nem módosít.

const $ = (id) => document.getElementById(id);

const ELEM_SUGO = {
  tower: "Torony: tedd le egy üres mezőre. Annyi pontot ér, amilyen magas, ha nincs mellette magasabb.",
  knight: "Lovag: tedd le egy üres mezőre. Elfoglalja a szomszédos tornyokat, az erők összege dönt.",
  landslide: "Földcsuszamlás: a célmező és szomszédai közül az üresek sziklák lesznek.",
  meteorite: "Meteorit: a célmező szikla lesz, az ott álló figura eltűnik.",
  conversion: "Konvertálás: válassz egy nem saját tornyot vagy lovagot, és a tiéd lesz.",
};

// A cellaméret a rendelkezésre álló helyhez igazodik (4-es rácsra kerekítve).
const cellaMeretBeallitas = (map) => {
  const keret = document.querySelector(".tabla-keret");
  const szelesseg = keret.clientWidth - 32;
  const magassag = window.innerHeight - keret.getBoundingClientRect().top - 72;
  const meret = Math.floor(Math.min(szelesseg / map.width, Math.max(260, magassag) / map.height) / 4) * 4;
  $("tabla").style.setProperty("--cella", `${Math.max(24, Math.min(64, meret))}px`);
};

// ---------- bábuk ----------

// Torony: a sziluett magassága a torony magasságával nő (1–9), tetején pártázattal, kőrétegekkel.
const toronySVG = (h) => {
  const teteje = Math.round(38 - (13 + h * 2.6));
  const retegek = [];
  for (let y = 38 - 5; y > teteje + 5; y -= 5) retegek.push(`<path d="M10 ${y}h20" class="reteg"/>`);
  const szamY = (teteje + 3 + 38) / 2 + 3.6;
  return `<svg viewBox="0 0 40 40" class="babu-svg" aria-hidden="true">
    <path class="test" d="M9 38V${teteje}h5v3h4v-3h4v3h4v-3h5V38z"/>
    <path class="arnyek" d="M25 38V${teteje + 3}h1v-3h5V38z"/>
    ${retegek.join("")}
    <text x="20" y="${szamY}" class="szam">${h}</text>
  </svg>`;
};

// Lovag: pajzs, benne a harci erő.
const lovagSVG = (ero) => `<svg viewBox="0 0 24 24" class="babu-svg" aria-hidden="true">
    <path class="test" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path class="arnyek" d="M12 2.03V21.95c4.15-1.45 8-3.95 8-8.95V6a1 1 0 0 0-1-1c-2 0-4.49-1.19-6.24-2.72A1.17 1.17 0 0 0 12 2.03z"/>
    <text x="12" y="15.6" class="szam">${ero}</text>
  </svg>`;

// Szikla: kétszínű, lapos kőtömb.
const SZIKLA_SVG = `<svg viewBox="0 0 40 40" class="babu-svg" aria-hidden="true">
    <path class="szikla-alap" d="M6 32l5-13 9-7 10 5 4 15z"/>
    <path class="szikla-feny" d="M11 19l9-7 3 11-9 4z"/>
    <path class="szikla-arnyek" d="M23 23l7-6 4 15-12 0z"/>
  </svg>`;

const figuraHTML = (f, ert) => {
  if (!f) return "";
  if (f.type === "rock") return `<div class="babu szikla">${SZIKLA_SVG}</div>`;
  if (f.type === "knight") return `<div class="babu lovag o-${f.owner || "n"}">${lovagSVG(f.strength)}</div>`;
  const e = ert || { ural: f.owner, blokkolt: false, elfoglalt: false, pont: 0 };
  const osztaly = ["babu", "torony", `o-${e.ural || "n"}`, e.blokkolt ? "blokkolt" : ""].join(" ");
  const foglalt = e.elfoglalt ? `<span class="foglalt-jel o-${f.owner || "n"}" title="Eredeti tulajdonos: ${JATEKOS_NEV[f.owner]}"></span>` : "";
  const pont = e.pont > 0 ? `<span class="pont-jel">+${e.pont}</span>` : "";
  return `<div class="${osztaly}">${toronySVG(f.height)}</div>${foglalt}${pont}`;
};

// ---------- tábla ----------

// opciok: { ervenyes: Set, erintett: Set, utolso: kulcs, kattinthato: bool }
const tablaRajzol = (map, opciok = {}) => {
  const tabla = $("tabla");
  const racs = palyaRacs(map);
  const ert = toronyErtekeles(map);
  tabla.style.gridTemplateColumns = `repeat(${map.width}, var(--cella))`;
  let html = "";
  for (let r = 0; r < map.height; r++)
    for (let c = 0; c < map.width; c++) {
      const k = kulcs(r, c);
      const osztaly = ["mezo"];
      if ((r + c) % 2) osztaly.push("masik");
      if (opciok.ervenyes && opciok.ervenyes.has(k)) osztaly.push("ervenyes");
      if (opciok.erintett && opciok.erintett.has(k)) osztaly.push("erintett");
      if (opciok.utolso === k) osztaly.push("utolso");
      if (opciok.kattinthato) osztaly.push("kattinthato");
      html += `<div class="${osztaly.join(" ")}" data-r="${r}" data-c="${c}">${figuraHTML(racs.get(k), ert.get(k))}</div>`;
    }
  tabla.innerHTML = html;
  cellaMeretBeallitas(map);
};

// ---------- készlet ----------

const keszletRajzol = (pool, kivalasztott, aktiv) => {
  $("keszlet").innerHTML = pool
    .map((e, i) => {
      const ertek = e.type === "tower" ? e.height : e.type === "knight" ? e.strength : "";
      const osztaly = ["kartya", `t-${e.type}`, i === kivalasztott ? "kivalasztott" : ""].join(" ");
      return `<button class="${osztaly}" data-i="${i}" ${aktiv ? "" : "disabled"} title="${elemNev(e)}">
        <span class="k-fej">${ikon(e.type, 16)}<span class="k-ertek">${ertek}</span></span>
        <span class="k-nev">${ELEM_NEV[e.type] || e.type}</span>
      </button>`;
    })
    .join("");
  $("keszletSzam").textContent = `${pool.length} elem`;
  $("keszletSugo").textContent =
    pool.length === 0 ? "A készlet elfogyott, a játék véget ért"
    : kivalasztott !== null && pool[kivalasztott] ? ELEM_SUGO[pool[kivalasztott].type] || ""
    : aktiv ? "Válassz egy elemet a készletből" : "";
};

// ---------- pontok ----------

const pontRajzol = (allapot, nevek, elonezet) => {
  const { pont, kovetkezo, vege, map, pool } = allapot;
  const ert = toronyErtekeles(map);
  const pontozok = { p1: 0, p2: 0 };
  ert.forEach((e) => { if (e.pont > 0 && pontozok[e.ural] !== undefined) pontozok[e.ural]++; });
  const tobb = Math.ceil(pool.length / 2);
  const kevesebb = Math.floor(pool.length / 2);
  const hatra = kovetkezo === "p1" ? { p1: tobb, p2: kevesebb } : { p1: kevesebb, p2: tobb };
  JATEKOSOK.forEach((p, i) => {
    const P = p.toUpperCase();
    $(`nev${P}`).textContent = JATEKOS_NEV[p];
    let pontSzoveg = String(pont[i]);
    if (elonezet) {
      const d = elonezet[i] - pont[i];
      pontSzoveg = `${elonezet[i]}<small class="${d > 0 ? "plusz" : d < 0 ? "minusz" : ""}">${d > 0 ? "+" : ""}${d !== 0 ? d : "±0"}</small>`;
    }
    $(`pont${P}`).innerHTML = pontSzoveg;
    $(`info${P}`).textContent = `${nevek[p] ? `${nevek[p]} · ` : ""}${pontozok[p]} pontozó torony · ${hatra[p]} lépés hátra`;
    const aktiv = !vege && kovetkezo === p;
    const nyertes = vege && pont[i] > pont[1 - i];
    $(`kartya${P}`).classList.toggle("aktiv", aktiv);
    $(`kartya${P}`).classList.toggle("nyertes", nyertes);
    $(`jel${P}`).textContent = nyertes ? "Nyertes" : aktiv ? "Lép" : "";
  });
};

// ---------- napló ----------

const naploRajzol = (naplo, aktivIndex, kattinthato) => {
  $("naplo").innerHTML = naplo
    .map((n, i) => {
      const hely = Number.isInteger(n.row) ? `${n.row + 1}, ${n.column + 1}` : "";
      const osztaly = ["lepes", `j-${n.jatekos}`, i === aktivIndex ? "aktiv" : "", kattinthato ? "kattinthato" : ""].join(" ");
      const megj = n.ervenytelen ? ' <span class="l-hiba" title="Érvénytelen index: az első elem elveszett">érvénytelen</span>' : "";
      return `<li class="${osztaly}" data-i="${i}">
        <span class="l-sorszam">${i + 1}</span>
        <span class="potty"></span>
        <span class="l-ikon">${ikon(n.elem?.type, 14)}</span>
        <span class="l-elem">${elemNev(n.elem)}${megj}</span>
        <span class="l-hely">${hely}</span>
      </li>`;
    })
    .join("");
  $("naploSzam").textContent = `${naplo.length}`;
  const aktiv = $("naplo").querySelector(".aktiv") || $("naplo").lastElementChild;
  if (aktiv) aktiv.scrollIntoView({ block: "nearest" });
};

// Egy mező szöveges leírása az infósorban.
const cellaLeiras = (map, r, c) => {
  const f = palyaRacs(map).get(kulcs(r, c));
  const hely = `${r + 1}. sor, ${c + 1}. oszlop`;
  if (!f) return `${hely}: üres mező`;
  if (f.type === "rock") return `${hely}: szikla`;
  if (f.type === "knight") return `${hely}: ${JATEKOS_NEV[f.owner]} lovag, harci erő ${f.strength}`;
  const e = toronyErtekeles(map).get(kulcs(r, c));
  let s = `${hely}: ${f.height} magas torony, lehelyezte: ${JATEKOS_NEV[f.owner]}`;
  if (e.ero.p1 || e.ero.p2) s += ` · lovagerő Kék ${e.ero.p1}, Narancs ${e.ero.p2}`;
  if (e.elfoglalt) s += ` · elfoglalta: ${JATEKOS_NEV[e.ural]}`;
  if (e.blokkolt) s += " · 0 pont, mert magasabb torony áll mellette";
  else if (!e.ural) s += " · semleges, senkinek sem ér pontot";
  else s += ` · ${e.pont} pont ${JATEKOS_NEV[e.ural]} játékosnak`;
  return s;
};
