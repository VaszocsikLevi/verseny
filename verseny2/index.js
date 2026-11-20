const Meret = 15;
const Gyumolcsok = ["alma", "korte", "szolo"]
const Jelek = { alma: "🍎", korte: "🍐", szolo: "🍇" };
const Energiak = { alma: 4, korte: 6, szolo: 5 };
const kezdoEnergia = 40;
let palya;
let palyaGyumolcs = 0;
let jatekosSor = null;
let jatekosOszlop = null;
let energia = kezdoEnergia;
let taska = { alma: 0, korte: 0, szolo: 0 };
let vege = false;

let szimulacio = false;
let automataFut = false;
let mindentFelszed = true;

//bot

// Mennyivel nőne a pontszám, ha felvennénk a (sor, oszlop) mezőn lévő gyümölcsöt?
const nyereseg = (sor, oszlop) =>{
    const fajta = palya[sor][oszlop];
    if (fajta === null) return 0;

    const masolat = {...taska};
    masolat[fajta]++;
    return pontszamSzamolas(masolat)-pontszamSzamolas(taska);
}

// Hány energiába kerül odalépni? (Manhattan-távolság, az első lépés ingyen)
const koltseg = (sor,oszlop)=>{
    if (jatekosSor===null) return 0;
    const tavolsag = Math.abs(sor - jatekosSor) + Math.abs(oszlop - jatekosOszlop);
    return tavolsag; 
}

// Mennyi pontot veszítenénk, ha megennénk egy ilyen fajtájú gyümölcsöt a táskából?
const veszteseg = (fajta)=>{
    const masolat = {...taska};          
    masolat[fajta]--;
    return pontszamSzamolas(taska) - pontszamSzamolas(masolat);
}

// Melyik gyümölcsöt érdemes megenni? Amelyiknél 1 energiáért a legkevesebb pont vész el.
const legjobbEtel= ()=>{
    let legjobbGyumi = null;
    let ertek = Infinity;
    for (const fajta of Gyumolcsok) {
        if(taska[fajta]===0) continue;
        // Körtevédelem
        if (fajta==="korte" && (taska["alma"] > 0 || taska["szolo"] > 0 )) continue;
        let pont = veszteseg(fajta) / Energiak[fajta]
        if(pont < ertek) {
            legjobbGyumi = fajta;
            ertek=pont;
        } 
    } 
    return legjobbGyumi
}

// melyik elérhető gyümölcs éri meg a legjobban?
const legjobbLepes=()=>{
    let legjobb = null;
    let legjobbErtek = -1;

    for (let i = 0; i < Meret; i++) {
        for (let y = 0; y < Meret; y++) {
            const ertek = palya[i][y];
            if (ertek == null) continue;
            if(koltseg(i,y) > energia) continue;            
            // Math.max(1, ...): az első lépésnél a költség 0
            let ertekArany = nyereseg(i,y)/ Math.max(1,koltseg(i,y));
            if (ertekArany > legjobbErtek) {
                legjobb = {sor: i, oszlop:y};
                legjobbErtek = ertekArany;
            }            
        }
    }
    return legjobb;
}

// Ha a cél felé menet van gyümölcs "útközben", azt vegyük fel előbb.
const utbaEsoGyumolcs=(cel)=>{
    if (jatekosSor === null) return cel;       // első lépésnél nincs "út"
    // a téglalap sarkai
    const sorTol = Math.min(jatekosSor, cel.sor);
    const sorIg = Math.max(jatekosSor, cel.sor);
    const oszlopTol = Math.min(jatekosOszlop, cel.oszlop);
    const oszlopIg = Math.max(jatekosOszlop, cel.oszlop);

    let legjobb = cel;
    let legkisebbTav = koltseg(cel.sor, cel.oszlop);
    for (let i = sorTol; i <= sorIg; i++) {
        for (let y = oszlopTol; y <= oszlopIg; y++) {
            if (palya[i][y] === null) continue;
            const tav = koltseg(i, y);
            if (tav < legkisebbTav) {             
                legjobb = {sor: i, oszlop: y};
                legkisebbTav = tav;
            }
        }
    }
    return legjobb;
}

// Lép, ha tud; ha nem, eszik; ha az sem megy, vége.
const automataLepes=()=>{
    if(vege) return false;
    let lepes = legjobbLepes();
    if (lepes!==null) {
        lepes = utbaEsoGyumolcs(lepes);   // ha van útközben gyümölcs, előbb azt vesszük fel
        kattintas(lepes.sor,lepes.oszlop);
        return true;
    }else{
        const etel = legjobbEtel();      // egyszer hívjuk meg, eltároljuk
        if (etel!==null) {
            eszik(etel);
            return true;
        }else{
            vege=true;
            kirajzol();
            return false;
        }
    }
}

// A bot a már kirajzolt változókon próbálgat a háttérben, de előtte elmenti az állapotot,
// utána pedig visszaállítja.

const mentes=()=>{
    return{
        palya: palya.map(sor=> [...sor]),  
        taska: {...taska},
        palyaGyumolcs: palyaGyumolcs,
        jatekosSor: jatekosSor,
        jatekosOszlop: jatekosOszlop,
        energia: energia,
        vege: vege
    }
}

// A palya-t és a taska-t is másolattal adjuk vissza
const visszaallit=(m)=>{
    palya = m.palya.map(sor=> [...sor]);
    taska = {...m.taska};
    palyaGyumolcs = m.palyaGyumolcs;
    jatekosSor = m.jatekosSor;
    jatekosOszlop = m.jatekosOszlop;
    energia = m.energia;
    vege = m.vege;
}

//Háttérben fut le a játék
const hatterJatek=()=>{
    let csucsPont = pontszamSzamolas(taska);
    let csucsLepes = 0;
    let lepesSzam = 0;
    while (automataLepes()) {
        lepesSzam++;
        const pont = pontszamSzamolas(taska);
        if (pont > csucsPont) {
            csucsPont = pont;
            csucsLepes = lepesSzam;
        }
    }

    // hány gyümölcs maradt a pályán?
    let maradt = 0;
    for (const sor of palya) {
        for (const mezo of sor) {
            if (mezo !== null) maradt++;
        }
    }

    if (mindentFelszed) {
        return { pont: pontszamSzamolas(taska), csucsLepes: lepesSzam, maradt: maradt };
    }
    return { pont: csucsPont, csucsLepes: csucsLepes, maradt: maradt };
}

// Melyik próbajáték a jobb? 
const jobbEredmeny=(uj, regi)=>{
    if (regi === null) return true;
    if (mindentFelszed && uj.maradt !== regi.maradt) {
        return uj.maradt < regi.maradt;
    }
    return uj.pont > regi.pont;
}

// 45 gyümölcsre végigjátsza a játékot és kiválasztja a legkedvezzöbb kezdőpontot
const legjobbKezdes=()=>{
    const m = mentes();
    szimulacio = true;
    let legjobb = null;

    for (let i = 0; i < Meret; i++) {
        for (let y = 0; y < Meret; y++) {
            if (m.palya[i][y] === null) continue;   // csak gyümölcsről lehet indulni

            visszaallit(m);
            kattintas(i, y);
            const eredmeny = hatterJatek(); 

            if (jobbEredmeny(eredmeny, legjobb)) {   // a mód szerinti összehasonlítás
                legjobb = { sor: i, oszlop: y, pont: eredmeny.pont, csucsLepes: eredmeny.csucsLepes, maradt: eredmeny.maradt };
            }
        }
    }

    visszaallit(m);                     
    szimulacio = false;
    return legjobb;
}

// Ha még nem léptünk: kiszámolja a legjobb kezdőpontot, és onnan játssza le.
// Ha már léptünk: a mostani állásból folytatja.
const automataJatek = () => {
    if (vege || automataFut) return;     
    automataFut = true;

    let terv;
    if (jatekosSor === null) {
        terv = legjobbKezdes();          
        console.log("Legjobb kezdés:", terv);
        kattintas(terv.sor, terv.oszlop);    
    } else {
        const m = mentes();
        szimulacio = true;
        terv = hatterJatek();
        visszaallit(m);
        szimulacio = false;
    }

    // Ugyanazt játssza le, amit a háttérben kiszámolt.
    let lepesSzam = 0;
    const idozito = setInterval(() => {
        let folytatja = false;
        if (lepesSzam < terv.csucsLepes) {
            folytatja = automataLepes();
            lepesSzam++;
        }
        if (!folytatja) {
            clearInterval(idozito);      
            vege = true;                 
            automataFut = false;
            kirajzol();
        }
    }, 200);                             
}

//játék

//kattintás érzékelésa
document.getElementById("palya").addEventListener("click", function (event) {
    const mezo = event.target.closest(".mezo");
    if (!mezo) return;

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
    if (szimulacio) return; 
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
function pontszamSzamolas(t) {
    const alma = t["alma"];
    const korte = t["korte"];
    const szolo = t["szolo"];

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
    oldalSav += `<p>Eddigi pontszámod: ${pontszamSzamolas(taska)}</p>`;

    for (const fajta of Gyumolcsok) {
        oldalSav += `<p class="gyumik">${Jelek[fajta]} ${taska[fajta]}</p>`;
    }
    //játékvége gomb az oldalon
    oldalSav +=
        `<p>
    <button id="mogomb" ${vege ? "disabled" : ""}>Gyümölcsevés</button>
    <button id="vegegomb" ${vege ? "disabled" : ""}>Játék vége</button>
    <button id="automataGomb" ${vege ? "disabled" : ""}>Automata játék</button>
    </p>`

    const tiltas = automataFut ? "disabled" : "";
    oldalSav += `<p>
        <label><input type="radio" name="automataMod" value="minden" ${mindentFelszed ? "checked" : ""} ${tiltas}> Mindent felszed</label>
        <label><input type="radio" name="automataMod" value="pont" ${!mindentFelszed ? "checked" : ""} ${tiltas}> Legtöbb pont</label>
    </p>`

    //pontszám megjelenítése a játék végeztével
    if (vege) {
        oldalSav += `<h2>Játék vége! Pontszámod: ${pontszamSzamolas(taska)}</h2>
        <button id="ujjatek">Új játék</button>`
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
    }

    if (jatekosSor === null) {
    jatekosSor = sor;
    jatekosOszlop = oszlop;
    gyumolcsFelszedes(sor, oszlop, mezoErteke);
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
            gyumolcsFelszedes(sor, oszlop, mezoErteke);
            kirajzol();
        }
    }
};

//gyümölcsfelszedés
function gyumolcsFelszedes(sor, oszlop, fajta) {
    taska[fajta]++;
    palya[sor][oszlop] = null;
    palyaGyumolcs--;
    if (palyaGyumolcs === 0) {
        vege = true;
    }
}


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
    }else if (event.target.id === "vegegomb") {
        vege = true;
        kirajzol();
    }else if (event.target.id === "ujjatek") {
    ujJatek();
    }else if (event.target.id === "automataGomb") {
        automataJatek();   
    }
});


document.getElementById("oldalsav").addEventListener("change", function (event) {
    if (event.target.name === "automataMod") {
        mindentFelszed = (event.target.value === "minden");
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
    jatekosSor = null;
    jatekosOszlop = null;
    energia = kezdoEnergia;
    taska = { alma: 0, korte: 0, szolo: 0 };
    vege = false;
    palyaGyumolcs =0;

    palya = palyaLetrehozas();
    gyumolcsFeltoltes(palya);
    kirajzol();
};
ujJatek();