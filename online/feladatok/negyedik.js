// térkép mérete és a falak aránya véletlen generálásnál
const meret = 10
const falArany = 0.2   // kb. a mezők 20%-a lesz fal

//terkép 1 = fal, 0 = szabad mező
const mintaTerkep = [
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 0, 1],
    [0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [0, 0, 1, 1, 1, 1, 0, 1, 1, 1],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0]
]

// az aktuális térkép és a bit kezdőhelye generálással tőltődik ki
let terkep4 = []
let kezdoSor4 = 0
let kezdoOszlop4 = 0

// a séta állapota
let latogatas4 = []      // hányszor járt a bit az adott mezőn
let bitSor4 = kezdoSor4
let bitOszlop4 = kezdoOszlop4
let lepesSzam4 = 0
let idozito4 = null      // a setInterval azonosítója, null ha áll a séta

// a 4 lehetséges irány: fel, le, balra, jobbra
const iranyok4 = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
]


// a feladat betöltése a gombra kattintva
function negyedikFeladat() {
    // ha egy korábbi séta még fut, leállítjuk
    setaMegallitas4()

    document.getElementById("torzs").innerHTML = `
    <div id="f4">
        <h2>Véletlenszerű séta</h2>

        <div id="f4Vezerlok">
            <button id="f4Indit">Indítás</button>
            <button id="f4Lepes">Egy lépés</button>
            <button id="f4Ujra">Újrakezdés</button>
            <button id="f4UjTerkep">Új térkép</button>
            <button id="f4Minta">Mintatérkép</button>

            <label for="f4Sebesseg">Lépésköz:</label>
            <input type="range" id="f4Sebesseg" min="50" max="1000" step="50" value="300">
            <span id="f4SebessegKiir">300 ms</span>

            <label>
                <input type="checkbox" id="f4Okos" checked>
                Kevésbé bejárt mező előnyben
            </label>
        </div>

        <table id="f4Terkep"></table>

        <p id="f4Statisztika"></p>
    </div>`

    // eseménykezelők
    document.getElementById("f4Indit").addEventListener("click", inditasVagyMegallitas4)
    document.getElementById("f4Lepes").addEventListener("click", lepes4)
    document.getElementById("f4Ujra").addEventListener("click", ujrakezdes4)
    document.getElementById("f4Sebesseg").addEventListener("input", sebessegValtozas4)
    document.getElementById("f4UjTerkep").addEventListener("click", ujTerkep4)
    document.getElementById("f4Minta").addEventListener("click", mintaBetoltes4)

    ujTerkep4()
}


// új, véletlen falakkal generált térkép
function ujTerkep4() {
    // addig generálunk, amíg minden szabad mező elérhető nem lesz
    // (különben a bit egy elzárt részt soha nem tudna felfedezni)
    do {
        terkep = []
        for (let i = 0; i < meret; i++) {
            terkep[i] = []
            for (let j = 0; j < meret; j++) {
                terkep[i][j] = Math.random() < falArany ? 1 : 0
            }
        }

        // véletlen kezdőhely egy szabad mezőn
        do {
            kezdoSor4 = Math.floor(Math.random() * meret)
            kezdoOszlop4 = Math.floor(Math.random() * meret)
        } while (terkep[kezdoSor4][kezdoOszlop4] === 1)

    } while (!osszefuggo4())

    ujrakezdes4()
}


// a feladatlap példa ábrájának betöltése
function mintaBetoltes4() {
    terkep4 = []
    for (let i = 0; i < mintaTerkep.length; i++) {
        terkep4[i] = mintaTerkep[i].slice()   // másolat, hogy az eredeti ne változzon
    }
    kezdoSor4 = 2
    kezdoOszlop4 = 2
    ujrakezdes4()
}


// minden szabad mező elérhető-e a kezdőhelyről? (elárasztás)
function osszefuggo4() {
    let elert = []
    for (let i = 0; i < meret; i++) {
        elert[i] = []
        for (let j = 0; j < meret; j++) {
            elert[i][j] = false
        }
    }

    // a kezdőhelyről indulva sorban bejárjuk az elérhető szomszédokat
    let teendo = [[kezdoSor4, kezdoOszlop4]]
    elert[kezdoSor4][kezdoOszlop4] = true
    let elertDb = 1

    while (teendo.length > 0) {
        const aktualis = teendo.pop()
        for (let k = 0; k < iranyok4.length; k++) {
            const ujSor = aktualis[0] + iranyok4[k][0]
            const ujOszlop = aktualis[1] + iranyok4[k][1]
            if (szabadMezo4(ujSor, ujOszlop) && !elert[ujSor][ujOszlop]) {
                elert[ujSor][ujOszlop] = true
                elertDb++
                teendo.push([ujSor, ujOszlop])
            }
        }
    }

    // a szabad mezők száma
    let szabadDb = 0
    for (let i = 0; i < meret; i++) {
        for (let j = 0; j < meret; j++) {
            if (terkep4[i][j] === 0) szabadDb++
        }
    }

    return elertDb === szabadDb
}


// a séta visszaállítása a kezdőállapotba
function ujrakezdes4() {
    setaMegallitas4()

    latogatas4 = []
    for (let i = 0; i < terkep4.length; i++) {
        latogatas4[i] = []
        for (let j = 0; j < terkep4[i].length; j++) {
            latogatas4[i][j] = 0
        }
    }

    bitSor4 = kezdoSor4
    bitOszlop4 = kezdoOszlop4
    lepesSzam4 = 0

    // a kezdőmezőn már ott áll a bit, ez is látogatásnak számít
    latogatas4[bitSor4][bitOszlop4] = 1

    tablaLetrehozas4()
    kirajzolas4()
}


// a táblázat celláinak létrehozása
function tablaLetrehozas4() {
    const tabla = document.getElementById("f4Terkep")
    tabla.innerHTML = ""

    for (let i = 0; i < terkep4.length; i++) {
        const ujSor = tabla.insertRow(-1)
        for (let j = 0; j < terkep4[i].length; j++) {
            const ujCella = ujSor.insertCell(-1)
            // koordináta tárolása a cellában, hogy később megtaláljuk
            ujCella.dataset.sor = i
            ujCella.dataset.oszlop = j
        }
    }
}


// a térkép frissítése a jelenlegi állapot alapján
function kirajzolas4() {
    const tabla = document.getElementById("f4Terkep")
    let bejartMezok = 0
    let szabadMezok = 0

    for (let i = 0; i < terkep4.length; i++) {
        for (let j = 0; j < terkep4[i].length; j++) {
            const cella = tabla.rows[i].cells[j]
            cella.className = ""

            if (terkep4[i][j] === 1) {
                cella.classList.add("f4Fal")
                cella.textContent = ""
                continue
            }

            szabadMezok++
            if (latogatas4[i][j] > 0) {
                bejartMezok++
                cella.classList.add("f4Bejart")
            }
            if (i === bitSor4 && j === bitOszlop4) {
                cella.classList.add("f4Bit")
            }

            cella.textContent = latogatas4[i][j]
        }
    }

    document.getElementById("f4Statisztika").textContent =
        "Lépések: " + lepesSzam4 + " | Felfedezett mezők: " + bejartMezok + " / " + szabadMezok
}


// léphet-e a bit erre a mezőre
function szabadMezo4(sor, oszlop) {
    // először a határ, csak utána olvassuk a tömböt
    if (sor < 0 || sor >= terkep4.length) return false
    if (oszlop < 0 || oszlop >= terkep4[0].length) return false
    return terkep4[sor][oszlop] === 0
}


// egy lépés a séta során
function lepes4() {
    // ha közben másik feladatra váltottak, a tábla már nem létezik → leállunk
    if (document.getElementById("f4Terkep") === null) {
        setaMegallitas4()
        return
    }

    // a szabad szomszédok összegyűjtése
    let lehetsegesek = []
    for (let k = 0; k < iranyok4.length; k++) {
        const ujSor = bitSor4 + iranyok4[k][0]
        const ujOszlop = bitOszlop4 + iranyok4[k][1]
        if (szabadMezo4(ujSor, ujOszlop)) {
            lehetsegesek.push([ujSor, ujOszlop])
        }
    }

    // körbe van zárva, nem tud lépni
    if (lehetsegesek.length === 0) {
        setaMegallitas4()
        return
    }

    // okos mód: csak azok a szomszédok maradnak, ahol a legkevesebbszer járt
    if (document.getElementById("f4Okos").checked) {
        let legkevesebb = Infinity
        for (let k = 0; k < lehetsegesek.length; k++) {
            const ertek = latogatas4[lehetsegesek[k][0]][lehetsegesek[k][1]]
            if (ertek < legkevesebb) {
                legkevesebb = ertek
            }
        }

        let legjobbak = []
        for (let k = 0; k < lehetsegesek.length; k++) {
            if (latogatas4[lehetsegesek[k][0]][lehetsegesek[k][1]] === legkevesebb) {
                legjobbak.push(lehetsegesek[k])
            }
        }
        lehetsegesek = legjobbak
    }

    // véletlen választás a maradék irányok közül
    // (döntetlennél is véletlen, különben mindig ugyanarra fordulna)
    const valasztott = lehetsegesek[Math.floor(Math.random() * lehetsegesek.length)]
    bitSor4 = valasztott[0]
    bitOszlop4 = valasztott[1]
    latogatas4[bitSor4][bitOszlop4]++
    lepesSzam4++

    kirajzolas4()
}


// Indítás / Megállítás gomb
function inditasVagyMegallitas4() {
    if (idozito4 === null) {
        setaInditas4()
    } else {
        setaMegallitas4()
    }
}


function setaInditas4() {
    const sebesseg = Number(document.getElementById("f4Sebesseg").value)
    idozito4 = setInterval(lepes4, sebesseg)
    document.getElementById("f4Indit").textContent = "Megállítás"
}


function setaMegallitas4() {
    if (idozito4 !== null) {
        clearInterval(idozito4)
        idozito4 = null
    }
    const gomb = document.getElementById("f4Indit")
    if (gomb !== null) {
        gomb.textContent = "Indítás"
    }
}


// a csúszka mozgatásakor az új sebesség azonnal érvényes
function sebessegValtozas4() {
    const sebesseg = document.getElementById("f4Sebesseg").value
    document.getElementById("f4SebessegKiir").textContent = sebesseg + " ms"

    // a setInterval futás közben nem veszi át az új időt, ezért újraindítjuk
    if (idozito4 !== null) {
        clearInterval(idozito4)
        idozito4 = setInterval(lepes4, Number(sebesseg))
    }
}


// a 4-es gomb bekötése
document.getElementById("feladat4").addEventListener("click", negyedikFeladat)