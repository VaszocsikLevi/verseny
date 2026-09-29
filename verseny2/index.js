const Meret = 15;
const Gyumolcsok = ["alma", "korte", "szolo"]
const Jelek = { alma: "🍎", korte: "🍐", szolo: "🍇" };
const Energiak = { alma: 4, korte: 6, szolo: 5 };
let palya;
let jatekosSor = null;
let jatekosOszlop = null;
let energia = 40;
let taska = { alma: 0, korte: 0, szolo: 0 };
let vege = false;

//kattintás érzékelésa
document.getElementById("palya").addEventListener("click", function (event) {
    const mezo = event.target.closest(".mezo"); //ha az emojira kattintunk az nem érzékrlné,ezért kell a kattintáshoz legközelebbit keresni.
    if (!mezo) return; //ha a rácson kivülre kattintunk akkor ne történjen semmi

    const sor = Number(mezo.dataset.sor);
    const oszlop = Number(mezo.dataset.oszlop);

    kattintas(sor, oszlop);
});

//pálya létrehozása
function palyaLetrehozas() {
    let palya = [];
    for (let i = 0; i < Meret; i++) {
        let sor = [];
        for (let y = 0; y < Meret; y++) {
            sor.push(null);

        }
        palya.push(sor);
    }
    return palya;
};

//feltöltjük gyümölccsel random mezőket
function gyumolcsFeltoltes(palya) {
    let palyaGyumolcs = 0;
    while (palyaGyumolcs < Meret * Meret * 0.2) {
        let mezoSor = Math.floor(Math.random() * Meret); // a math.floor 0-1 közötti számot generál
        let mezoOszlop = Math.floor(Math.random() * Meret);
        let randomGyumolcs = Math.floor(Math.random() * 3);
        if (palya[mezoSor][mezoOszlop] == null) {
            palya[mezoSor][mezoOszlop] = Gyumolcsok[randomGyumolcs];
            palyaGyumolcs++;
        }
    }
};

//végigmegy minden mezőn
function kirajzol() {
    let mezok = "";
    for (let i = 0; i < Meret; i++) {
        for (let y = 0; y < Meret; y++) {
            const ertek = palya[i][y];
            const jatekosItt = (i === jatekosSor && y === jatekosOszlop);
            let jel = "";
            if (jatekosItt) {
                jel = "🕺🏻";
            } else if (ertek !== null) {
                jel = Jelek[ertek];
            }
            const osztaly = jatekosItt ? "mezo jatekos" : "mezo";

            mezok += `<div class="${osztaly}" data-sor="${i}" data-oszlop="${y}">${jel}</div>`
        }
    }
    document.getElementById("palya").innerHTML = mezok;


    oldalsavKirajzol();

};

//pontszámítás
function pontszamSzamolas() {
    const alma = taska["alma"];
    const korte = taska["korte"];
    const szolo = taska["szolo"];

    //alma 2pont
    let almaPont = alma * 2;
    //Szőlő 3pont
    let szoloPont = szolo * 3;
    //Körte pontjai(1+2+3.....)
    let kortePont = 0;
    for (let i = 1; i <= korte; i++) {
        kortePont += i;
    }
    //alma-szolo bonusz
    let parok = Math.min(alma, szolo);
    let parokBonusz = parok * 2

    return almaPont + szoloPont + kortePont + parokBonusz;
}


function oldalsavKirajzol() {
    let oldalSav = `<p>Energia: ${energia}</p>`;

    //pontszám kijelzés
    oldalSav += `<p>Eddigi pontszámod: ${pontszamSzamolas()}</p>`;

    for (const fajta of Gyumolcsok) {
        oldalSav += `<p class="gyumik">${Jelek[fajta]} ${taska[fajta]}</p>`;
    }
    //játékvége gomb az oldalon
    oldalSav +=
        `<p>
    <button id="mogomb" ${vege ? "disabled" : ""}>Gyümölcsevés</button>
    <button id="vegegomb"${vege ? "disabled" : ""}>Játék vége</button>
    </p>`

    //pontszám megjelenítése a játék végeztével
    if (vege) {
        oldalSav += `<h2>Játék vége! Pontszámod: ${pontszamSzamolas()}</h2>`;
    }

    document.getElementById("oldalsav").innerHTML = oldalSav;
}

//a kattintás szabályai
function kattintas(sor, oszlop) {

    if (vege) return;

    const mezoErteke = palya[sor][oszlop];
    if (mezoErteke === null) {
        alert("Nincs gyümölcs a mezőn!")
        return;
    }  // csak gyümölcsre lehet lépni

    if (jatekosSor === null) {
        jatekosSor = sor;
        jatekosOszlop = oszlop;
        taska[mezoErteke]++;
        palya[sor][oszlop] = null;
        kirajzol();
    }
    else {
        const tavolsag = Math.abs(sor - jatekosSor) + Math.abs(oszlop - jatekosOszlop);
        if (tavolsag > energia) {
            energiaModalNyit(tavolsag);
            return;
        }
        else {
            energia -= tavolsag;
            jatekosSor = sor;
            jatekosOszlop = oszlop;
            palya[sor][oszlop] = null;
            taska[mezoErteke]++;
            kirajzol();
        }
    }
};

function evesModalNyit() {
    if (vege) return;

    let gombok = "";
    for (const fajta of Gyumolcsok) {
        const db = taska[fajta];
        const tiltas = db === 0 ? "disabled" : "";
        gombok += `<button class="evesGomb" data-fajta="${fajta}" ${tiltas}>${Jelek[fajta]} ${db} db (+${Energiak[fajta]} energia)</button>`;
    }

    document.getElementById("evesGombok").innerHTML = gombok;
    document.getElementById("evesModal").showModal();
}

function eszik(fajta) {
    if (taska[fajta] === 0) return;

    taska[fajta]--;
    energia += Energiak[fajta];

    document.getElementById("evesModal").close();
    kirajzol();
}

document.getElementById("oldalsav").addEventListener("click", function (event) {
    if (event.target.id === "mogomb") {
        evesModalNyit();
    } else if (event.target.id === "vegegomb") {
        vege = true;
        kirajzol();
    }
});

document.getElementById("evesGombok").addEventListener("click", function (event) {
    const gomb = event.target.closest(".evesGomb");
    if (!gomb) return;
    eszik(gomb.dataset.fajta);
});

document.getElementById("evesMegse").addEventListener("click", function () {
    document.getElementById("evesModal").close();
});

function energiaModalNyit(tavolsag) {
    document.getElementById("energiaUzenet").textContent =
        `Ehhez a lépéshez ${tavolsag} energia kell, neked ${energia} van.`;
    document.getElementById("energiaModal").showModal();
}

document.getElementById("energiaEszem").addEventListener("click", function () {
    document.getElementById("energiaModal").close();
    evesModalNyit();
});

document.getElementById("energiaVege").addEventListener("click", function () {
    vege = true;
    document.getElementById("energiaModal").close();
    kirajzol();
});


//játék indítása
function ujJatek() {
    palya = palyaLetrehozas();
    gyumolcsFeltoltes(palya);
    kirajzol();
};
ujJatek();