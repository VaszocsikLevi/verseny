// Gép kezdőlapja
function gepHivoLapja(kez) {
    return legkevesebbPontu(kez);
}

//A gép válaszol:
// - ha tud ütni, kötelező, és a leggyengébb ütő lapját használja (a jobbakat megtartja)
// - ha nem tud, a legkevesebb pontot érőt dobja el
function gepRaadottLapja(kez, hivottLap) {
    const uto = utoLapok(kez, hivottLap);
    if (uto.length > 0) {
        return leggyengebb(uto);
    }
    return legkevesebbPontu(kez);
}

function legkevesebbPontu(lapok) {
    let valasztott = lapok[0];
    for (let i = 1; i < lapok.length; i++) {
        const lap = lapok[i];
        // egyenlő pontnál a gyengébbet választja
        if (lap.pont < valasztott.pont ||
            (lap.pont === valasztott.pont && lap.erosseg < valasztott.erosseg)) {
            valasztott = lap;
        }
    }
    return valasztott;
}

function leggyengebb(lapok) {
    let valasztott = lapok[0];
    for (let i = 1; i < lapok.length; i++) {
        if (lapok[i].erosseg < valasztott.erosseg) {
            valasztott = lapok[i];
        }
    }
    return valasztott;
}
