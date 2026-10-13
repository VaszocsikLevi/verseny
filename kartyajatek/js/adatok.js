// ============================================================
// adatok.js – beállítások és a kártyák adatai
// Itt nincs semmi logika, csak számok és listák.
// ============================================================

// Méretek (pixelben)
var VASZON_SZELES = 900;
var VASZON_MAGAS = 600;
var LAP_SZELES = 80;
var LAP_MAGAS = 120;
var LAP_KOZ = 16;              // két lap közti távolság a kézben

// Hol vannak a lapsorok a vásznon (y koordináta)
var GEP_SOR_Y = 40;
var ASZTAL_Y = 240;
var JATEKOS_SOR_Y = VASZON_MAGAS - LAP_MAGAS - 40;

// Játék beállítások
var KEZDO_LAPOK = 4;
var GEP_GONDOLKODIK = 900;     // ezredmásodperc – ennyit "gondolkodik" a gép
var KOR_SZUNET = 1500;         // ennyi ideig látszik a két lap a kör végén

// A magyar kártya 4 színe
var SZINEK = [
    { nev: "Piros", rajzSzin: "#c0392b" },
    { nev: "Tök",   rajzSzin: "#e67e22" },
    { nev: "Zöld",  rajzSzin: "#27ae60" },
    { nev: "Makk",  rajzSzin: "#7a5230" }
];

// A 8 érték.
// erosseg: melyik a nagyobb ütésnél (1 a leggyengébb, 8 a legerősebb)
// pont:    mennyit ér a végén (figurás lap = 0)
var ERTEKEK = [
    { nev: "VII",    erosseg: 1, pont: 7 },
    { nev: "VIII",   erosseg: 2, pont: 8 },
    { nev: "IX",     erosseg: 3, pont: 9 },
    { nev: "X",      erosseg: 4, pont: 10 },
    { nev: "Alsó",   erosseg: 5, pont: 0 },
    { nev: "Felső",  erosseg: 6, pont: 0 },
    { nev: "Király", erosseg: 7, pont: 0 },
    { nev: "Ász",    erosseg: 8, pont: 0 }
];
