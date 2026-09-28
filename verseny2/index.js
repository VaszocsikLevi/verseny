const Meret = 15;
const Gyumolcsok = ["alma", "korte", "szolo"]
const Jelek = { alma: "🍎", korte: "🍐", szolo: "🍇" };
let palya ;
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
    while (palyaGyumolcs < Meret*Meret*0.2) {
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
            const  jatekosItt = (i === jatekosSor && y === jatekosOszlop);
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
    document.getElementById("palya").innerHTML= mezok;

    
    oldalsavKirajzol();

};

function oldalsavKirajzol() {
    let oldalSav = `<p>Energia: ${energia}</p>`;
    for(const fajta of Gyumolcsok){
        oldalSav += `<p class="gyumik">${Jelek[fajta]} ${taska[fajta]}</p>`;
    }
    oldalSav += `<p><button>Gyümölcsevés</button></p>`
    document.getElementById("oldalsav").innerHTML = oldalSav;
}

//a kattintás szabályai
function kattintas(sor, oszlop) {
    
    if (vege) return;

    const mezoErteke = palya[sor][oszlop];
    if (mezoErteke === null){
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
    else{
        const tavolsag = Math.abs(sor - jatekosSor) + Math.abs(oszlop - jatekosOszlop);
        if (tavolsag > energia) {
            alert("Elfogyott az energiád")
            return;
        }
        else{
            energia -= tavolsag;
            jatekosSor = sor;
            jatekosOszlop = oszlop;
            palya[sor][oszlop]= null;
            taska[mezoErteke]++;
            kirajzol();
        }
    }
};

//játék indítása
function ujJatek() {
    palya = palyaLetrehozas();
    gyumolcsFeltoltes(palya);
    kirajzol();
};
ujJatek();