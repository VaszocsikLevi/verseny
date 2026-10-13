// ============================================================
// jatek.js – a játék menete
// Ez tárolja, hol tart a játék, és ez dönti el, ki jön.
// Magyarázat: MAGYARAZAT.md 2. és 3. pont
// ============================================================

// ---- A játék állapota (globális változók) ----
var pakli = [];
var jatekosKeze = [];
var gepKeze = [];
var jatekosVitte = [];     // a játékos által elvitt lapok
var gepVitte = [];
var hivo = "";             // "jatekos" vagy "gep"
var hivottLap = null;      // ami az asztalon van bal oldalt
var raadottLap = null;     // ami rá lett téve
var fazis = "";            // hol tart a kör, lásd lent
var uzenet = "";           // a vásznon megjelenő szöveg
var idozito = null;        // a futó setTimeout azonosítója

// A lehetséges fázisok:
//   "jatekos_hiv"    – a játékos választ hívó lapot
//   "gep_hiv"        – a gép gondolkodik, mit hívjon
//   "jatekos_ratesz" – a gép hívott, a játékos tesz rá
//   "gep_ratesz"     – a játékos hívott, a gép gondolkodik
//   "kor_vege"       – rövid szünet, látszik a két lap
//   "vege"           – vége a játéknak

function ujJatek() {
    clearTimeout(idozito);   // ha az előző játékból még várt valami, töröljük

    pakli = paklitKeszit();
    kever(pakli);            // (c)

    jatekosKeze = [];
    gepKeze = [];
    jatekosVitte = [];
    gepVitte = [];

    // (c) 4-4 lap felváltva
    for (var i = 0; i < KEZDO_LAPOK; i++) {
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

    // Ha mindkét kéz üres, nincs több kör
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
    var lap = gepHivoLapja(gepKeze);
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
    var lap = jatekosKeze[index];

    if (fazis === "jatekos_hiv") {
        kivesz(jatekosKeze, lap);
        hivottLap = lap;
        fazis = "gep_ratesz";
        uzenet = "A gép gondolkodik...";
        idozito = setTimeout(gepRatesz, GEP_GONDOLKODIK);
    }
    else if (fazis === "jatekos_ratesz") {
        // (f) ha tud ütni, nem tehet le mást
        if (!lerakhatoE(lap)) {
            uzenet = "Ezt nem teheted le – ütnöd kell!";
            return;
        }
        kivesz(jatekosKeze, lap);
        raadottLap = lap;
        korKiertekel();
    }
    // minden más fázisban a kattintás nem csinál semmit
}

// Leteheti-e most a játékos ezt a lapot?
// A rajzolás is ezt használja a sárga kiemeléshez.
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
    var lap = gepRaadottLapja(gepKeze, hivottLap);
    kivesz(gepKeze, lap);
    raadottLap = lap;
    korKiertekel();
}

// Ki vitte a kört?
function korKiertekel() {
    var nyertes;
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

    hivo = nyertes;          // aki vitte, az hív a következő körben
    fazis = "kor_vege";

    // Kis szünet, hogy látszódjon a két lap, utána húzás és új kör
    idozito = setTimeout(function () {
        huzas();
        korIndul();
    }, KOR_SZUNET);
}

// (g) mindketten húznak, ha van még lap. Aki vitte, az húz először.
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

// (j) győztes kihirdetése
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
