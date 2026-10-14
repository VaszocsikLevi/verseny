
function paklitKeszit() {
    const pakli = [];
    for (let i = 0; i < SZINEK.length; i++) {
        for (let j = 0; j < ERTEKEK.length; j++) {
            pakli.push({
                szin: SZINEK[i].nev,
                rajzSzin: SZINEK[i].rajzSzin,
                ertek: ERTEKEK[j].nev,
                erosseg: ERTEKEK[j].erosseg,
                pont: ERTEKEK[j].pont
            });
        }
    }
    return pakli;   
}

// Keverés (Fisher–Yates) – magyarázat: MAGYARAZAT.md 4. pont
function kever(pakli) {
    for (let i = pakli.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));   // véletlen hely 0..i között
        const csere = pakli[i];
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
