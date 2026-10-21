// Játék állapotát tároló változók
let pirosHelye = 0;          // A piros kártya aktuális pozíciója (0, 1 vagy 2)
let kartyaSorrend = [0, 1, 2]; // A kártyák logikai sorrendje a dobozokban
let lehetValasztani = false;  // Csak keverés után lehessen kattintani

// CSS injektálása JavaScriptből (külön CSS fájl sem kell!)
function cssBetoltese() {
    if (!document.getElementById("dinamikus-css-harmadik")) {
        const stilusElem = document.createElement("style");
        stilusElem.id = "dinamikus-css-harmadik";
        stilusElem.innerHTML = `
            .jatek-tarolo {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                user-select: none;
            }
            .kartyak-kontener {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin: 20px 0;
                position: relative;
                min-height: 150px;
            }
            .kartya-doboz {
                width: 100px;
                height: 140px;
                font-size: 32px;
                line-height: 140px;
                border: 3px solid #333;
                border-radius: 12px;
                cursor: pointer;
                background-color: #b0bec5;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                position: relative;
                left: 0;
                top: 0;
                transition: transform 0.3s ease-in-out, background-color 0.3s;
                text-align: center;
            }
            .kartya-doboz:hover {
                transform: translateY(-5px);
            }
            .sebesseg-doboz {
                font-size: 16px;
                font-weight: bold;
            }
            .sebesseg-doboz select {
                padding: 5px 10px;
                font-size: 15px;
                border-radius: 5px;
            }
            #startGomb {
                padding: 10px 25px;
                font-size: 18px;
                font-weight: bold;
                background-color: #4caf50;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }
            #startGomb:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            #uzenet {
                font-size: 22px;
                min-height: 30px;
                margin: 10px 0;
            }
        `;
        document.head.appendChild(stilusElem);
    }
}

// 1. A HTML gombra lefutó betöltő függvény
function loadFeladat3() {
    cssBetoltese();

    const torzs = document.getElementById("torzs");
    torzs.innerHTML = `
        <div class="jatek-tarolo">
            <h1>Itt a piros, hol a piros!</h1>

            <div class="sebesseg-doboz">
                <label for="sebesseg">Cserék sebessége: </label>
                <select id="sebesseg">
                    <option value="600">Lassú (Könnyű)</option>
                    <option value="350" selected>Közepes (Normál)</option>
                    <option value="180">Gyors (Nehéz!)</option>
                </select>
            </div>

            <button id="startGomb" onclick="jatekInditasa()">Start</button>

            <h2 id="uzenet">Nyomj a Start gombra a kezdéshez!</h2>

            <div class="kartyak-kontener">
                <div class="kartya-doboz" id="k0" onclick="valasztas(0)">?</div>
                <div class="kartya-doboz" id="k1" onclick="valasztas(1)">?</div>
                <div class="kartya-doboz" id="k2" onclick="valasztas(2)">?</div>
            </div>
        </div>
    `;
}

// 2. Játék indítása
function jatekInditasa() {
    document.getElementById('startGomb').disabled = true;
    document.getElementById('sebesseg').disabled = true;
    lehetValasztani = false;
    kartyaSorrend = [0, 1, 2];

    const uzenet = document.getElementById('uzenet');
    uzenet.innerText = "Jegyezd meg, hol a piros!";

    // Véletlenszerűen kiválasztjuk a piros kártya helyét (0, 1 vagy 2)
    pirosHelye = Math.floor(Math.random() * 3);

    const kartyak = [
        document.getElementById('k0'),
        document.getElementById('k1'),
        document.getElementById('k2')
    ];

    // Megjelenítjük a 3 kártyát: 1 piros (🔴), 2 kék (🔵)
    for (let i = 0; i < 3; i++) {
        if (i === pirosHelye) {
            kartyak[i].innerText = "🔴";
            kartyak[i].style.backgroundColor = "#ffebee";
        } else {
            kartyak[i].innerText = "🔵";
            kartyak[i].style.backgroundColor = "#e3f2fd";
        }
    }

    // Pár másodperc (2 másodperc) múlva lefordítjuk és keverünk
    setTimeout(function () {
        lefordit();
        setTimeout(function () {
            keveres(0); // Megkezdjük a cseréket
        }, 500);
    }, 2000);
}

// Kártyák lefordítása
function lefordit() {
    const kartyak = [
        document.getElementById('k0'),
        document.getElementById('k1'),
        document.getElementById('k2')
    ];
    for (let i = 0; i < 3; i++) {
        kartyak[i].innerText = "?";
        kartyak[i].style.backgroundColor = "#b0bec5";
    }
}

// 3. Keverés animációval
function keveres(csereSzam) {
    const ido = Number(document.getElementById('sebesseg').value);
    const kartyak = [
        document.getElementById('k0'),
        document.getElementById('k1'),
        document.getElementById('k2')
    ];

    // 8 csere után véget ér a keverés
    if (csereSzam >= 8) {
        document.getElementById('uzenet').innerText = "Hol a piros? Válassz egy kártyát!";
        lehetValasztani = true;
        document.getElementById('startGomb').disabled = false;
        document.getElementById('sebesseg').disabled = false;
        return;
    }

    document.getElementById('uzenet').innerText = `Keverés`;

    // Két különböző kártya sorsolása a cseréhez
    let a = Math.floor(Math.random() * 3);
    let b = Math.floor(Math.random() * 3);
    while (a === b) {
        b = Math.floor(Math.random() * 3);
    }

    // Piros helyének követése
    if (pirosHelye === a) {
        pirosHelye = b;
    } else if (pirosHelye === b) {
        pirosHelye = a;
    }

    // Animáció kiszámítása: eltolás X és Y tengelyen (íves mozgáshoz)
    const tavolsagX = (b - a) * 120; // A kártyák közötti távolság (100px + 20px gap)

    // Az egyik kicsit feljebb, a másik lejjebb kerül mozgás közben (íves hatás)
    kartyak[a].style.transition = `transform ${ido / 1000}s ease-in-out`;
    kartyak[b].style.transition = `transform ${ido / 1000}s ease-in-out`;

    kartyak[a].style.transform = `translate(${tavolsagX}px, -20px)`;
    kartyak[b].style.transform = `translate(${-tavolsagX}px, 20px)`;

    // Ha az animáció félidejénél járunk, visszaállítjuk az eredeti helyzetüket
    setTimeout(function () {
        kartyak[a].style.transition = "none";
        kartyak[b].style.transition = "none";
        kartyak[a].style.transform = "translate(0, 0)";
        kartyak[b].style.transform = "translate(0, 0)";

        // Újabb csere indítása
        setTimeout(function () {
            keveres(csereSzam + 1);
        }, 50);

    }, ido);
}

// 4. Kártya kiválasztása
function valasztas(index) {
    if (!lehetValasztani) return; // Ha épp keverünk, ne reagáljon

    lehetValasztani = false;
    const kartyak = [
        document.getElementById('k0'),
        document.getElementById('k1'),
        document.getElementById('k2')
    ];

    // Felfedjük az összes kártyát
    for (let i = 0; i < 3; i++) {
        if (i === pirosHelye) {
            kartyak[i].innerText = "🔴";
            kartyak[i].style.backgroundColor = "#ffebee";
        } else {
            kartyak[i].innerText = "🔵";
            kartyak[i].style.backgroundColor = "#e3f2fd";
        }
    }

    // Kiértékelés
    const uzenet = document.getElementById('uzenet');
    if (index === pirosHelye) {
        uzenet.innerText = "Gratulálok, ez a piros! Nyertél! 🎉";
    } else {
        uzenet.innerText = "Sajnos ez nem a piros volt! Vesztettél. ❌";
    }
}