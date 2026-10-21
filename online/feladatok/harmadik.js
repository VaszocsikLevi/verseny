//változók
let pirosHelye = 0;
let lehetValasztani = false;

// 3 kártya elérése
function getKartyak() {
    return [
        document.getElementById('k0'),
        document.getElementById('k1'),
        document.getElementById('k2')
    ];
}

// Feladat betöltése
function loadFeladat3() {
    document.getElementById("torzs").innerHTML = `
        <div class="jatek-tarolo">
            <h1>Itt a piros, hol a piros!</h1>
            <label>Sebesség: </label>
            <select id="sebesseg">
                <option value="600">Lassú</option>
                <option value="350" selected>Közepes</option>
                <option value="180">Gyors</option>
            </select>
            <br><br>
            <button id="startGomb" onclick="jatekInditasa()">Start</button>
            <h2 id="uzenet">Nyomj a Start gombra!</h2>
            <div class="kartyak-kontener">
                <div class="kartya-doboz" id="k0" onclick="valasztas(0)">?</div>
                <div class="kartya-doboz" id="k1" onclick="valasztas(1)">?</div>
                <div class="kartya-doboz" id="k2" onclick="valasztas(2)">?</div>
            </div>
        </div>
    `;
}

// Játék indítása
function jatekInditasa() {
    document.getElementById('startGomb').disabled = true;
    document.getElementById('sebesseg').disabled = true;
    lehetValasztani = false;
    document.getElementById('uzenet').innerText = "Jegyezd meg, hol a piros!";

    pirosHelye = Math.floor(Math.random() * 3);
    const kartyak = getKartyak();

    // Színek feltöltése
    for (let i = 0; i < 3; i++) {
        kartyak[i].innerText = (i === pirosHelye) ? "🔴" : "🔵";
        kartyak[i].style.backgroundColor = (i === pirosHelye) ? "#ffebee" : "#e3f2fd";
    }

    // 2 másodperc után lefordít és keverni kezd
    setTimeout(() => {
        for (let k of kartyak) {
            k.innerText = "?";
            k.style.backgroundColor = "#b0bec5";
        }
        setTimeout(() => keveres(0), 500);
    }, 2000);
}

// Keverés animációval
function keveres(csereSzam) {
    const ido = Number(document.getElementById('sebesseg').value);
    const kartyak = getKartyak();

    if (csereSzam >= 8) {
        document.getElementById('uzenet').innerText = "Hol a piros? Válassz egyet!";
        lehetValasztani = true;
        document.getElementById('startGomb').disabled = false;
        document.getElementById('sebesseg').disabled = false;
        return;
    }

    document.getElementById('uzenet').innerText = "Keverés...";

    // Kártya csere
    let a = Math.floor(Math.random() * 3);
    let b = Math.floor(Math.random() * 3);
    while (a === b) b = Math.floor(Math.random() * 3);

    // Piros pozíció frissítése
    if (pirosHelye === a) pirosHelye = b;
    else if (pirosHelye === b) pirosHelye = a;

    // Mozgatás
    const tavolsagX = (b - a) * 120;
    kartyak[a].style.transition = `transform ${ido / 1000}s ease-in-out`;
    kartyak[b].style.transition = `transform ${ido / 1000}s ease-in-out`;
    kartyak[a].style.transform = `translate(${tavolsagX}px, -20px)`;
    kartyak[b].style.transform = `translate(${-tavolsagX}px, 20px)`;

    // Visszaállítás és következő lépés
    setTimeout(() => {
        kartyak[a].style.transition = "none";
        kartyak[b].style.transition = "none";
        kartyak[a].style.transform = "translate(0, 0)";
        kartyak[b].style.transform = "translate(0, 0)";

        setTimeout(() => keveres(csereSzam + 1), 50);
    }, ido);
}

// Választás kiértékelése
function valasztas(index) {
    if (!lehetValasztani) return;
    lehetValasztani = false;

    const kartyak = getKartyak();
    for (let i = 0; i < 3; i++) {
        kartyak[i].innerText = (i === pirosHelye) ? "🔴" : "🔵";
        kartyak[i].style.backgroundColor = (i === pirosHelye) ? "#ffebee" : "#e3f2fd";
    }

    document.getElementById('uzenet').innerText = (index === pirosHelye)
        ? "Gratulálok, nyertél!"
        : "Nem találtad el! Vesztettél.";
}