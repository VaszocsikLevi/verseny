// A vezetékek színei és a magyar nevük az ABC szerinti rendezéshez
const szinAdatok = [
    { nev: "zöld", kod: "green" },
    { nev: "sárga", kod: "yellow" },
    { nev: "piros", kod: "red" },
    { nev: "kék", kod: "blue" },
    { nev: "fekete", kod: "black" }
];

let vezetekek = [];
let elvartSorrend = [];
let aktualisLepes = 0;
let jatekVége = false;

// A feladat betöltése
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

// Bombagenerálás
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

    // Vezetékek generálása
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

    // Helyes sorrend
    let masolat = [...vezetekek];

    masolat.sort((a, b) => {
        // Magyar ABC szerinti összehasonlítás visszafelé
        let abcHasonlitas = b.nev.localeCompare(a.nev, 'hu');

        if (abcHasonlitas !== 0) {
            return abcHasonlitas;
        } else {
            return a.id - b.id;
        }
    });

    elvartSorrend = masolat.map(v => v.id);
}

// Drót elvágása
function vagasiKiserlet(index) {
    if (jatekVége) return;

    //vezeték vágás ellenőrzése
    if (index === elvartSorrend[aktualisLepes]) {
        // Jó
        document.getElementById(`v_${index}`).classList.add("elvagva");
        aktualisLepes++;

        // mind meg van-e
        if (aktualisLepes === elvartSorrend.length) {
            jatekVége = true;
            const uzenet = document.getElementById("bombaUzenet");
            uzenet.innerText = "Kiváló munka Carl közlegény! A bombát sikeresen hatástalanítottad! 🎖️🎉";
            uzenet.style.color = "green";
        }
    } else {
        // Játék vége amikor vesztesz
        jatekVége = true;
        const uzenet = document.getElementById("bombaUzenet");
        uzenet.innerText = "BOOM! 💥 Rossz vezetéket vágtál el! A bomba felrobbant.";
        uzenet.style.color = "red";
    }
}