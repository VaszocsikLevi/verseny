// ============================================================
// gep.js – a számítógép döntései (feladat i pont)
// Egyszerű, de mindig betartja a szabályt, mert csak a
// rakhatoLapok / utoLapok listából választ.
// ============================================================

// Ha a gép hív: a legkevesebb pontot érő lapot teszi le,
// hogy ha elviszik, kevés pontot veszítsen.
function gepHivoLapja(kez) {
    return legkevesebbPontu(kez);
}

// Ha a gép tesz rá:
// - ha tud ütni, KÖTELEZŐ, és a leggyengébb ütő lapját használja (a jobbakat megtartja)
// - ha nem tud, a legkevesebb pontot érőt dobja el
function gepRaadottLapja(kez, hivottLap) {
    var uto = utoLapok(kez, hivottLap);
    if (uto.length > 0) {
        return leggyengebb(uto);
    }
    return legkevesebbPontu(kez);
}

// ---- segédfüggvények: kiválasztják a "legkisebb" lapot egy listából ----

function legkevesebbPontu(lapok) {
    var valasztott = lapok[0];
    for (var i = 1; i < lapok.length; i++) {
        var lap = lapok[i];
        // egyenlő pontnál a gyengébbet választja
        if (lap.pont < valasztott.pont ||
            (lap.pont === valasztott.pont && lap.erosseg < valasztott.erosseg)) {
            valasztott = lap;
        }
    }
    return valasztott;
}

function leggyengebb(lapok) {
    var valasztott = lapok[0];
    for (var i = 1; i < lapok.length; i++) {
        if (lapok[i].erosseg < valasztott.erosseg) {
            valasztott = lapok[i];
        }
    }
    return valasztott;
}
