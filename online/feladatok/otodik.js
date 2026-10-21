// A vezetékek színei és a magyar nevük az ABC szerinti rendezéshez
const szinAdatok = [
    { nev: "zöld", kod: "green" },
    { nev: "sárga", kod: "yellow" },
    { nev: "piros", kod: "red" },
    { nev: "kék", kod: "blue" },
    { nev: "fekete", kod: "black" }
];

let vezetekek = [];      // A generált vezetékek tömbje
let elvartSorrend = [];  // A helyes vágási sorrend (indexek)
let aktualisLepes = 0;   // Hol tart a játékos a vágásban
let jatekVége = false;

// A feladat betöltő függvénye (amit a HTML gomb hív meg)
function loadFeladat5() {
    const torzs = document.getElementById("torzs");
    torzs.innerHTML = `
        <div class="bomba-tarolo">
            <button onclick="bombaGeneralas()">Generál</button>
            <br><br>
            <label for="nehezseg">Nehézség? </label>
            <input type="number" id="nehezseg" value="8" min="3" max="15" style="width: 50px;">

            <div id="bombaUzenet">Állítsd be a nehézséget és nyomj a Generál gombra!</div>

            <div class="vezetekek-kontener" id="vezetekekKontener"></div>
        </div>
    `;
}

// Bombagenerálás és a helyes sorrend kiszámítása
function bombaGeneralas() {
    const db = Number(document.getElementById("nehezseg").value);
    const kontener = document.getElementById("vezetekekKontener");

    kontener.innerHTML = "";
    vezetekek = [];
    elvartSorrend = [];
    aktualisLepes = 0;
    jatekVége = false;

    document.getElementById("bombaUzenet").innerText = "Hatástalanítsd a bombát! Óvatosan vágd a drótokat!";
    document.getElementById("bombaUzenet").style.color = "black";

    // 1. Vezetékek véletlenszerű generálása
    for (let i = 0; i < db; i++) {
        const r = Math.floor(Math.random() * szinAdatok.length);
        const szinObj = szinAdatok[r];

        vezetekek.push({
            id: i,
            nev: szinObj.nev,
            kod: szinObj.kod
        });

        // HTML elem létrehozása a vezetéknek
        const vezetekElem = document.createElement("div");
        vezetekElem.className = "vezetek";
        vezetekElem.id = `v_${i}`;
        vezetekElem.style.backgroundColor = szinObj.kod;
        vezetekElem.onclick = function () { vagasiKiserlet(i); };

        kontener.appendChild(vezetekElem);
    }

    // 2. Helyes vágási sorrend kiszámítása
    let masolat = [...vezetekek];

    masolat.sort((a, b) => {
        // Magyar ABC szerinti összehasonlítás visszafelé
        let abcHasonlitas = b.nev.localeCompare(a.nev, 'hu');

        if (abcHasonlitas !== 0) {
            return abcHasonlitas; // Ha eltér a szín neve, az ABC-ben későbbi jön előre
        } else {
            return a.id - b.id;  // Ha egyforma a szín, a baloldali (kisebb id) jön előre
        }
    });

    elvartSorrend = masolat.map(v => v.id);
}

// Drót elvágásának kezelése
function vagasiKiserlet(index) {
    if (jatekVége) return;

    // Megnézzük, hogy a kattintott vezeték a következő elvárt-e
    if (index === elvartSorrend[aktualisLepes]) {
        // Helyes vágás!
        document.getElementById(`v_${index}`).classList.add("elvagva");
        aktualisLepes++;

        // Ellenőrizzük, hogy mindet elvágta-e
        if (aktualisLepes === elvartSorrend.length) {
            jatekVége = true;
            const uzenet = document.getElementById("bombaUzenet");
            uzenet.innerText = "Kiváló munka Carl közlegény! A bombát sikeresen hatástalanítottad! 🎖️🎉";
            uzenet.style.color = "green";
        }
    } else {
        // Rossz vágás -> BUMM!
        jatekVége = true;
        const uzenet = document.getElementById("bombaUzenet");
        uzenet.innerText = "BOOM! 💥 Rossz vezetéket vágtál el! A bomba felrobbant.";
        uzenet.style.color = "red";
    }
}