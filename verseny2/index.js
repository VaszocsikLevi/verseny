const Meret = 15;
const Gyumolcsok = ["alma", "korte", "szolo"]
const Jelek = { alma: "🍎", korte: "🍐", szolo: "🍇" };
let palya ;
let jatekosSor = null;
let jatekosOszlop = null;
let energia = 40;
let taska = { alma: 0, korte: 0, szolo: 0 };
let vege = false;

document.getElementById("palya").addEventListener("click", function (event) {
    const mezo = event.target.closest(".mezo");
    if (!mezo) return;

    const sor = Number(mezo.dataset.sor);
    const oszlop = Number(mezo.dataset.oszlop);

    kattintas(sor, oszlop);
});

function kattintas(sor, oszlop) {
    
    if (vege) return;

    const mezoErteke = palya[sor][oszlop];
    if (mezoErteke === null) return;

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
            return;
        }
        else{
            
        }
    }
}

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
}


function gyumolcsFeltoltes(palya) {
    let palyaGyumolcs = 0;
    while (palyaGyumolcs < 40) {
        let mezoSor = Math.floor(Math.random() * 15);
        let mezoOszlop = Math.floor(Math.random() * 15);
        let randomGyumolcs = Math.floor(Math.random() * 3);
        if (palya[mezoSor][mezoOszlop] == null) {
            palya[mezoSor][mezoOszlop] = Gyumolcsok[randomGyumolcs];
            palyaGyumolcs++;
        }
    }
}

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

            mezok += `<div class="mezo" data-sor="${i}" data-oszlop="${y}">${jel}</div>`
        }
    }
    document.getElementById("palya").innerHTML= mezok;
}

function ujJatek() {
    palya = palyaLetrehozas();
    gyumolcsFeltoltes(palya);
    kirajzol();
}

ujJatek();

console.log(taska);