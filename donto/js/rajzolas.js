// Megjelenítés: tábla, készlet, pontok, napló. Csak rajzol, állapotot nem módosít.

const $ = (id) => document.getElementById(id);

const ELEM_IKON = { tower: "♜", knight: "♞", landslide: "⛰", meteorite: "☄", conversion: "⟲" };

const ELEM_SUGO = {
  tower: "Torony: tedd le egy üres mezőre. Annyi pontot ér, amilyen magas, ha nincs mellette magasabb.",
  knight: "Lovag: tedd le egy üres mezőre. Elfoglalja a szomszédos tornyokat (az erők összege dönt).",
  landslide: "Földcsuszamlás: a célmező és szomszédai közül az üresek sziklák lesznek.",
  meteorite: "Meteorit: a célmező szikla lesz, az ott álló figura eltűnik.",
  conversion: "Konvertálás: válassz egy nem saját tornyot vagy lovagot – a tiéd lesz.",
};

// A cellaméret a rendelkezésre álló helyhez igazodik.
const cellaMeretBeallitas = (map) => {
  const keret = document.querySelector(".tabla-keret");
  const szelesseg = keret.clientWidth - 8;
  const magassag = window.innerHeight - keret.getBoundingClientRect().top - 70;
  const meret = Math.floor(Math.min(szelesseg / map.width, Math.max(260, magassag) / map.height));
  $("tabla").style.setProperty("--cella", `${Math.max(24, Math.min(64, meret))}px`);
};

const figuraHTML = (f, ert) => {
  if (!f) return "";
  if (f.type === "rock") return `<div class="szikla"></div>`;
  if (f.type === "knight")
    return `<div class="lovag o-${f.owner || "n"}"><span class="ikon">♞</span><b>${f.strength}</b></div>`;
  // torony
  const e = ert || { ural: f.owner, blokkolt: false, elfoglalt: false, pont: 0 };
  const osztaly = ["torony", `o-${e.ural || "n"}`, e.blokkolt ? "blokkolt" : "", e.pont > 0 ? "pontoz" : ""].join(" ");
  const foglalt = e.elfoglalt ? `<span class="foglalt-jel o-${f.owner || "n"}" title="eredeti tulajdonos">⚔</span>` : "";
  const pont = e.pont > 0 ? `<span class="pont-jel">+${e.pont}</span>` : "";
  return `<div class="${osztaly}" style="--h:${f.height}"><span class="oszlop"></span><b>${f.height}</b>${foglalt}${pont}</div>`;
};

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
      if ((r + c) % 2) osztaly.push("sotet");
      if (opciok.ervenyes && opciok.ervenyes.has(k)) osztaly.push("ervenyes");
      if (opciok.erintett && opciok.erintett.has(k)) osztaly.push("erintett");
      if (opciok.utolso === k) osztaly.push("utolso");
      if (opciok.kattinthato) osztaly.push("kattinthato");
      html += `<div class="${osztaly.join(" ")}" data-r="${r}" data-c="${c}">${figuraHTML(racs.get(k), ert.get(k))}</div>`;
    }
  tabla.innerHTML = html;
  cellaMeretBeallitas(map);
};

const keszletRajzol = (pool, kivalasztott, aktiv) => {
  $("keszlet").innerHTML = pool
    .map((e, i) => {
      const ertek = e.type === "tower" ? e.height : e.type === "knight" ? e.strength : "";
      const osztaly = ["kartya", `t-${e.type}`, i === kivalasztott ? "kivalasztott" : ""].join(" ");
      return `<button class="${osztaly}" data-i="${i}" ${aktiv ? "" : "disabled"} title="${elemNev(e)}">
        <span class="k-ikon">${ELEM_IKON[e.type] || "?"}</span>
        <span class="k-ertek">${ertek}</span>
        <span class="k-nev">${ELEM_NEV[e.type] || e.type}</span>
      </button>`;
    })
    .join("");
  $("keszletSzam").textContent = `${pool.length} elem`;
  $("keszletSugo").textContent =
    pool.length === 0 ? "A készlet elfogyott – a játék véget ért."
    : kivalasztott !== null && pool[kivalasztott] ? ELEM_SUGO[pool[kivalasztott].type] || ""
    : aktiv ? "Válassz egy elemet a készletből." : "";
};

const pontRajzol = (allapot, nevek, elonezet) => {
  const { pont, kovetkezo, vege, map, pool } = allapot;
  const ert = toronyErtekeles(map);
  const pontozok = { p1: 0, p2: 0 };
  ert.forEach((e) => { if (e.pont > 0 && pontozok[e.ural] !== undefined) pontozok[e.ural]++; });
  const hatra = { p1: Math.ceil(pool.length / 2), p2: Math.floor(pool.length / 2) };
  if (kovetkezo === "p2") { hatra.p1 = Math.floor(pool.length / 2); hatra.p2 = Math.ceil(pool.length / 2); }
  JATEKOSOK.forEach((p, i) => {
    const P = p.toUpperCase();
    $(`nev${P}`).textContent = nevek[p];
    let pontSzoveg = String(pont[i]);
    if (elonezet) {
      const d = elonezet[i] - pont[i];
      pontSzoveg = `${elonezet[i]}<small class="${d > 0 ? "plusz" : d < 0 ? "minusz" : ""}">${d > 0 ? "+" : ""}${d !== 0 ? d : "±0"}</small>`;
    }
    $(`pont${P}`).innerHTML = pontSzoveg;
    $(`info${P}`).textContent = `${pontozok[p]} pontozó torony · még ${hatra[p]} lépés`;
    $(`kartya${P}`).classList.toggle("aktiv", !vege && kovetkezo === p);
    $(`kartya${P}`).classList.toggle("nyertes", vege && pont[i] > pont[1 - i]);
  });
};

const naploRajzol = (naplo, aktivIndex, kattinthato) => {
  $("naplo").innerHTML = naplo
    .map((n, i) => {
      const hely = Number.isInteger(n.row) ? `(${n.row + 1}. sor, ${n.column + 1}. oszlop)` : "";
      const osztaly = ["lepes", `j-${n.jatekos}`, i === aktivIndex ? "aktiv" : "", kattinthato ? "kattinthato" : ""].join(" ");
      const megj = n.ervenytelen ? ' <em title="érvénytelen index: az első elem elveszett">érvénytelen</em>' : "";
      return `<li class="${osztaly}" data-i="${i}"><span class="l-jatekos">${JATEKOS_NEV[n.jatekos]}</span> ${ELEM_IKON[n.elem?.type] || ""} ${elemNev(n.elem)} <span class="l-hely">${hely}</span>${megj}</li>`;
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
  if (f.type === "rock") return `${hely}: szikla (akadály)`;
  if (f.type === "knight") return `${hely}: ${JATEKOS_NEV[f.owner]} lovag, harci erő ${f.strength}`;
  const e = toronyErtekeles(map).get(kulcs(r, c));
  let s = `${hely}: torony, magasság ${f.height} · lehelyezte: ${JATEKOS_NEV[f.owner]}`;
  if (e.ero.p1 || e.ero.p2) s += ` · lovagerő Kék ${e.ero.p1} – Narancs ${e.ero.p2}`;
  if (e.elfoglalt) s += ` · elfoglalta: ${JATEKOS_NEV[e.ural]}`;
  if (e.blokkolt) s += " · 0 pont (magasabb szomszéd)";
  else if (!e.ural) s += " · semleges, senkinek sem ér pontot";
  else s += ` · ${e.pont} pont → ${JATEKOS_NEV[e.ural]}`;
  return s;
};
