// Méretek 
const VASZON_SZELES = 900;
const VASZON_MAGAS = 600;
const LAP_SZELES = 80;
const LAP_MAGAS = 120;
const LAP_KOZ = 16;              

// Lapsorok a vásznon 
const GEP_SOR_Y = 40;
const ASZTAL_Y = 240;
const JATEKOS_SOR_Y = VASZON_MAGAS - LAP_MAGAS - 40;

// Játék beállítások
const KEZDO_LAPOK = 4;
const GEP_GONDOLKODIK = 900;     
const KOR_SZUNET = 1500;        

// A magyar kártya 4 színe
const SZINEK = [
    { nev: "Piros", rajzSzin: "#c0392b" },
    { nev: "Tök",   rajzSzin: "#e67e22" },
    { nev: "Zöld",  rajzSzin: "#27ae60" },
    { nev: "Makk",  rajzSzin: "#7a5230" }
];


// Kártyák erössége, pontszáma
const ERTEKEK = [
    { nev: "VII",    erosseg: 1, pont: 7 },
    { nev: "VIII",   erosseg: 2, pont: 8 },
    { nev: "IX",     erosseg: 3, pont: 9 },
    { nev: "X",      erosseg: 4, pont: 10 },
    { nev: "Alsó",   erosseg: 5, pont: 0 },
    { nev: "Felső",  erosseg: 6, pont: 0 },
    { nev: "Király", erosseg: 7, pont: 0 },
    { nev: "Ász",    erosseg: 8, pont: 0 }
];
