let pakli = [];
let jatekosKeze = [];
let gepKeze = [];
let jatekosVitte = [];     
let gepVitte = [];
let hivo = "";             
let hivottLap = null;      
let raadottLap = null;     
let fazis = "";            
let uzenet = "";          
let idozito = null;       


function ujJatek() {
    clearTimeout(idozito);   

    pakli = paklitKeszit();
    kever(pakli);            

    jatekosKeze = [];
    gepKeze = [];
    jatekosVitte = [];
    gepVitte = [];

   
    for (let i = 0; i < KEZDO_LAPOK; i++) {
        jatekosKeze.push(huz(pakli));
        gepKeze.push(huz(pakli));
    }

    // (b) véletlenszerű kezdő
    if (Math.random() < 0.5) {
        hivo = "jatekos";
    } else {
        hivo = "gep";
    }

    korIndul();
}

function korIndul() {
    hivottLap = null;
    raadottLap = null;

    if (jatekosKeze.length === 0 && gepKeze.length === 0) {
        jatekVege();
        return;
    }

    if (hivo === "jatekos") {
        fazis = "jatekos_hiv";
        uzenet = "Te hívsz – kattints egy lapodra!";
    } else {
        fazis = "gep_hiv";
        uzenet = "A gép hív...";
        idozito = setTimeout(gepHiv, GEP_GONDOLKODIK);
    }
}

function gepHiv() {
    let lap = gepHivoLapja(gepKeze);
    kivesz(gepKeze, lap);
    hivottLap = lap;
    fazis = "jatekos_ratesz";

    if (utoLapok(jatekosKeze, hivottLap).length > 0) {
        uzenet = "Tudsz ütni, ezért ütnöd kell! (sárga lapok)";
    } else {
        uzenet = "Nem tudsz ütni – tegyél rá bármit.";
    }
}

// Az esemenyek.js hívja meg, ha a játékos a saját lapjára kattint
function jatekosKattintott(index) {
    let lap = jatekosKeze[index];

    if (fazis === "jatekos_hiv") {
        kivesz(jatekosKeze, lap);
        hivottLap = lap;
        fazis = "gep_ratesz";
        uzenet = "A gép gondolkodik...";
        idozito = setTimeout(gepRatesz, GEP_GONDOLKODIK);
    }
    else if (fazis === "jatekos_ratesz") {
        
        if (!lerakhatoE(lap)) {
            uzenet = "Ezt nem teheted le – ütnöd kell!";
            return;
        }
        kivesz(jatekosKeze, lap);
        raadottLap = lap;
        korKiertekel();
    }

}

// Leteheti-e most a játékos ezt a lapot?
function lerakhatoE(lap) {
    if (fazis === "jatekos_hiv") {
        return true;
    }
    if (fazis === "jatekos_ratesz") {
        return rakhatoLapok(jatekosKeze, hivottLap).indexOf(lap) !== -1;
    }
    return false;
}

function gepRatesz() {
    let lap = gepRaadottLapja(gepKeze, hivottLap);
    kivesz(gepKeze, lap);
    raadottLap = lap;
    korKiertekel();
}

// Ki vitte a kört?
function korKiertekel() {
    let nyertes;
    if (utiE(hivottLap, raadottLap)) {
        // ütött → a NEM hívó viszi
        if (hivo === "jatekos") {
            nyertes = "gep";
        } else {
            nyertes = "jatekos";
        }
    } else {
        nyertes = hivo;
    }

    if (nyertes === "jatekos") {
        jatekosVitte.push(hivottLap, raadottLap);
        uzenet = "Te vitted a kört!";
    } else {
        gepVitte.push(hivottLap, raadottLap);
        uzenet = "A gép vitte a kört.";
    }

    hivo = nyertes;          
    fazis = "kor_vege";

    
    idozito = setTimeout(function () {
        huzas();
        korIndul();
    }, KOR_SZUNET);
}

// Mindketten húznak, ha van még lap. Aki vitte, az húz először.
function huzas() {
    if (pakli.length === 0) {
        return;
    }
    if (hivo === "jatekos") {
        jatekosKeze.push(huz(pakli));
        gepKeze.push(huz(pakli));
    } else {
        gepKeze.push(huz(pakli));
        jatekosKeze.push(huz(pakli));
    }
}

// Győztes kihirdetése
function jatekVege() {
    fazis = "vege";
    var jatekosPont = pontokOsszege(jatekosVitte);
    var gepPont = pontokOsszege(gepVitte);

    if (jatekosPont > gepPont) {
        uzenet = "Nyertél! " + jatekosPont + " : " + gepPont;
    } else if (gepPont > jatekosPont) {
        uzenet = "A gép nyert. " + jatekosPont + " : " + gepPont;
    } else {
        uzenet = "Döntetlen! " + jatekosPont + " : " + gepPont;
    }
}

// Kivesz egy lapot egy kézből
function kivesz(kez, lap) {
    var hely = kez.indexOf(lap);
    if (hely !== -1) {
        kez.splice(hely, 1);
    }
}
