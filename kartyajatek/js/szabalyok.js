// ============================================================
// szabalyok.js – a játék szabályai
// Ezeket a függvényeket az ember ÉS a gép is használja,
// így mindkettőre ugyanaz a szabály vonatkozik.
// ============================================================

// Üti-e a ráadott lap a hívott lapot?
// Üt, ha: ugyanaz az értéke, VAGY ugyanaz a színe és erősebb.
function utiE(hivottLap, raadottLap) {
    if (raadottLap.ertek === hivottLap.ertek) {
        return true;
    }
    if (raadottLap.szin === hivottLap.szin && raadottLap.erosseg > hivottLap.erosseg) {
        return true;
    }
    return false;
}

// A kézből azok a lapok, amelyek ütik a hívott lapot
function utoLapok(kez, hivottLap) {
    var eredmeny = [];
    for (var i = 0; i < kez.length; i++) {
        if (utiE(hivottLap, kez[i])) {
            eredmeny.push(kez[i]);
        }
    }
    return eredmeny;
}

// Mit tehet rá a játékos? (feladat f pont)
// Ha van ütő lapja, CSAK azok közül választhat.
// Ha nincs, bármelyiket leteheti.
function rakhatoLapok(kez, hivottLap) {
    var uto = utoLapok(kez, hivottLap);
    if (uto.length > 0) {
        return uto;
    }
    return kez;
}

// Lapok pontjainak összege (feladat h pont)
function pontokOsszege(lapok) {
    var osszeg = 0;
    for (var i = 0; i < lapok.length; i++) {
        osszeg += lapok[i].pont;
    }
    return osszeg;
}
