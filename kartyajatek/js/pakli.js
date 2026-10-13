// ============================================================
// pakli.js – pakli elkészítése, keverés, húzás
// ============================================================

// Egy lap egy sima objektum, pl.:
// { szin: "Piros", rajzSzin: "#c0392b", ertek: "Ász", erosseg: 8, pont: 0 }
function paklitKeszit() {
    var pakli = [];
    for (var i = 0; i < SZINEK.length; i++) {
        for (var j = 0; j < ERTEKEK.length; j++) {
            pakli.push({
                szin: SZINEK[i].nev,
                rajzSzin: SZINEK[i].rajzSzin,
                ertek: ERTEKEK[j].nev,
                erosseg: ERTEKEK[j].erosseg,
                pont: ERTEKEK[j].pont
            });
        }
    }
    return pakli;   // 4 szín × 8 érték = 32 lap
}

// Keverés (Fisher–Yates) – magyarázat: MAGYARAZAT.md 4. pont
function kever(pakli) {
    for (var i = pakli.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));   // véletlen hely 0..i között
        var csere = pakli[i];
        pakli[i] = pakli[j];
        pakli[j] = csere;
    }
}

// A pakli tetejéről (a tömb végéről) elvesz egy lapot
function huz(pakli) {
    if (pakli.length === 0) {
        return null;
    }
    return pakli.pop();
}
