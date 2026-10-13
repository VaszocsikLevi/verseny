// ============================================================
// rajzolas.js – minden, ami a vászonra kerül.
// Csak OLVASSA a játék változóit, nem módosítja őket.
// ============================================================

var vaszon;
var ctx;

function rajzolasIndit() {
    vaszon = document.getElementById("jatekter");
    ctx = vaszon.getContext("2d");
    setInterval(rajzol, 30);     // mint a tananyagban: 30 ms-onként újrarajzol
}

// Hányadik pixelnél kezdődik a kézben az index-edik lap?
// A lapsor középre van igazítva. Az esemenyek.js is ezt használja!
function lapX(index, darab) {
    var teljesSzelesseg = darab * LAP_SZELES + (darab - 1) * LAP_KOZ;
    var kezdoX = (VASZON_SZELES - teljesSzelesseg) / 2;
    return kezdoX + index * (LAP_SZELES + LAP_KOZ);
}

function rajzol() {
    // Asztal (háttér)
    ctx.fillStyle = "#2e6b45";
    ctx.fillRect(0, 0, VASZON_SZELES, VASZON_MAGAS);

    // (d) A gép lapjai: csak a hátlapjuk látszik
    for (var i = 0; i < gepKeze.length; i++) {
        hatlapotRajzol(lapX(i, gepKeze.length), GEP_SOR_Y);
    }

    // A játékos lapjai: előlap, a letehetők sárgán kiemelve
    for (var j = 0; j < jatekosKeze.length; j++) {
        var lap = jatekosKeze[j];
        lapotRajzol(lap, lapX(j, jatekosKeze.length), JATEKOS_SOR_Y, lerakhatoE(lap));
    }

    // Az asztal közepe: hívott lap balra, ráadott lap jobbra
    if (hivottLap !== null) {
        lapotRajzol(hivottLap, VASZON_SZELES / 2 - LAP_SZELES - 10, ASZTAL_Y, false);
    }
    if (raadottLap !== null) {
        lapotRajzol(raadottLap, VASZON_SZELES / 2 + 10, ASZTAL_Y, false);
    }

    // Pakli a bal oldalon
    if (pakli.length > 0) {
        hatlapotRajzol(60, ASZTAL_Y);
        szoveg(pakli.length + " lap", 100, ASZTAL_Y + LAP_MAGAS + 22, 14, "center");
    }

    // (h) Pontok mindkét oldalon
    szoveg("Gép: " + pontokOsszege(gepVitte) + " pont", 20, 25, 18, "left");
    szoveg("Te: " + pontokOsszege(jatekosVitte) + " pont", 20, VASZON_MAGAS - 12, 18, "left");
    if (hivo === "jatekos") {
        szoveg("Hívó: Te", VASZON_SZELES - 20, 25, 18, "right");
    } else {
        szoveg("Hívó: Gép", VASZON_SZELES - 20, 25, 18, "right");
    }

    // Üzenet
    szoveg(uzenet, VASZON_SZELES / 2, ASZTAL_Y - 20, 20, "center");

    // (j) Játék vége: sötét réteg + nagy felirat
    if (fazis === "vege") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, VASZON_SZELES, VASZON_MAGAS);
        szoveg("Vége a játéknak", VASZON_SZELES / 2, 250, 40, "center");
        szoveg(uzenet, VASZON_SZELES / 2, 310, 30, "center");
        szoveg("Új játékhoz nyomd meg a gombot.", VASZON_SZELES / 2, 360, 18, "center");
    }
}

function lapotRajzol(lap, x, y, kiemelt) {
    // fehér alap
    ctx.fillStyle = "#fbf8ef";
    ctx.fillRect(x, y, LAP_SZELES, LAP_MAGAS);

    // keret: sárga és vastag, ha kiemelt
    if (kiemelt) {
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 5;
    } else {
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
    }
    ctx.strokeRect(x, y, LAP_SZELES, LAP_MAGAS);

    // szín neve felül, érték középen, pont alul
    ctx.textAlign = "center";
    ctx.fillStyle = lap.rajzSzin;
    ctx.font = "bold 15px Arial";
    ctx.fillText(lap.szin, x + LAP_SZELES / 2, y + 28);
    ctx.font = "bold 22px Arial";
    ctx.fillText(lap.ertek, x + LAP_SZELES / 2, y + LAP_MAGAS / 2 + 10);
    ctx.fillStyle = "#666666";
    ctx.font = "12px Arial";
    ctx.fillText(lap.pont + " pont", x + LAP_SZELES / 2, y + LAP_MAGAS - 12);
}

function hatlapotRajzol(x, y) {
    ctx.fillStyle = "#8e2b2b";
    ctx.fillRect(x, y, LAP_SZELES, LAP_MAGAS);
    ctx.strokeStyle = "#f2efe6";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 6, y + 6, LAP_SZELES - 12, LAP_MAGAS - 12);
}

function szoveg(szoveg, x, y, meret, igazitas) {
    ctx.fillStyle = "#f2efe6";
    ctx.font = meret + "px Arial";
    ctx.textAlign = igazitas;
    ctx.fillText(szoveg, x, y);
}
