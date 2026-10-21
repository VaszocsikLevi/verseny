// térkép mérete és a falak aránya véletlen generálásnál
const meret = 10
const falArany = 0.2   

// az aktuális térkép és a bit kezdőhelye (generáláskor töltődik ki)
let terkep = []
let kezdoSor = 0
let kezdoOszlop = 0

// a séta állapota
let latogatas = []      // hányszor járt a bit az adott mezőn
let bitSor = kezdoSor
let bitOszlop = kezdoOszlop
let lepesSzam = 0
let idozito = null      // a setInterval azonosítója, null ha áll a séta

// a 4 lehetséges irány: fel, le, balra, jobbra
const iranyok = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
]


// a feladat betöltése a gombra kattintva
function negyedikFeladat() {
    // ha egy korábbi séta még fut, leállítjuk
    setaMegallitas()

    document.getElementById("torzs").innerHTML = `
    <div id="f4">
        <h2>Véletlenszerű séta</h2>

        <div id="f4Vezerlok">
            <button id="f4Indit">Indítás</button>
            <button id="f4Lepes">Egy lépés</button>
            <button id="f4Ujra">Újrakezdés</button>
            <button id="f4UjTerkep">Új térkép</button>
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
    document.getElementById("f4Indit").addEventListener("click", inditasVagyMegallitas)
    document.getElementById("f4Lepes").addEventListener("click", lepes)
    document.getElementById("f4Ujra").addEventListener("click", ujrakezdes)
    document.getElementById("f4Sebesseg").addEventListener("input", sebessegValtozas)
    document.getElementById("f4UjTerkep").addEventListener("click", ujTerkep)
    ujTerkep()
}


// új, véletlen falakkal generált térkép
function ujTerkep() {
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
            kezdoSor = Math.floor(Math.random() * meret)
            kezdoOszlop = Math.floor(Math.random() * meret)
        } while (terkep[kezdoSor][kezdoOszlop] === 1)

    } while (!osszefuggo())

    ujrakezdes()
}

// minden szabad mező elérhető-e a kezdőhelyről? (elárasztás)
function osszefuggo() {
    let elert = []
    for (let i = 0; i < meret; i++) {
        elert[i] = []
        for (let j = 0; j < meret; j++) {
            elert[i][j] = false
        }
    }

    // a kezdőhelyről indulva sorban bejárjuk az elérhető szomszédokat
    let teendo = [[kezdoSor, kezdoOszlop]]
    elert[kezdoSor][kezdoOszlop] = true
    let elertDb = 1

    while (teendo.length > 0) {
        const aktualis = teendo.pop()
        for (let k = 0; k < iranyok.length; k++) {
            const ujSor = aktualis[0] + iranyok[k][0]
            const ujOszlop = aktualis[1] + iranyok[k][1]
            if (szabadMezo(ujSor, ujOszlop) && !elert[ujSor][ujOszlop]) {
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
            if (terkep[i][j] === 0) szabadDb++
        }
    }

    return elertDb === szabadDb
}


// a séta visszaállítása a kezdőállapotba
function ujrakezdes() {
    setaMegallitas()

    latogatas = []
    for (let i = 0; i < terkep.length; i++) {
        latogatas[i] = []
        for (let j = 0; j < terkep[i].length; j++) {
            latogatas[i][j] = 0
        }
    }

    bitSor = kezdoSor
    bitOszlop = kezdoOszlop
    lepesSzam = 0

    // a kezdőmezőn már ott áll a bit, ez is látogatásnak számít
    latogatas[bitSor][bitOszlop] = 1

    tablaLetrehozas()
    kirajzolas()
}


// a táblázat celláinak létrehozása
function tablaLetrehozas() {
    const tabla = document.getElementById("f4Terkep")
    tabla.innerHTML = ""

    for (let i = 0; i < terkep.length; i++) {
        const ujSor = tabla.insertRow(-1)
        for (let j = 0; j < terkep[i].length; j++) {
            const ujCella = ujSor.insertCell(-1)
            // koordináta tárolása a cellában, hogy később megtaláljuk
            ujCella.dataset.sor = i
            ujCella.dataset.oszlop = j
        }
    }
}


// a térkép frissítése a jelenlegi állapot alapján
function kirajzolas() {
    const tabla = document.getElementById("f4Terkep")
    let bejartMezok = 0
    let szabadMezok = 0

    for (let i = 0; i < terkep.length; i++) {
        for (let j = 0; j < terkep[i].length; j++) {
            const cella = tabla.rows[i].cells[j]
            cella.className = ""

            if (terkep[i][j] === 1) {
                cella.classList.add("f4Fal")
                cella.textContent = ""
                continue
            }

            szabadMezok++
            if (latogatas[i][j] > 0) {
                bejartMezok++
                cella.classList.add("f4Bejart")
            }
            if (i === bitSor && j === bitOszlop) {
                cella.classList.add("f4Bit")
            }

            cella.textContent = latogatas[i][j]
        }
    }

    document.getElementById("f4Statisztika").textContent =
        "Lépések: " + lepesSzam + " | Felfedezett mezők: " + bejartMezok + " / " + szabadMezok
}


// léphet-e a bit erre a mezőre
function szabadMezo(sor, oszlop) {
    // először a határ, csak utána olvassuk a tömböt
    if (sor < 0 || sor >= terkep.length) return false
    if (oszlop < 0 || oszlop >= terkep[0].length) return false
    return terkep[sor][oszlop] === 0
}


// egy lépés a séta során
function lepes() {
    // ha közben másik feladatra váltottak, a tábla már nem létezik → leállunk
    if (document.getElementById("f4Terkep") === null) {
        setaMegallitas()
        return
    }

    // a szabad szomszédok összegyűjtése
    let lehetsegesek = []
    for (let k = 0; k < iranyok.length; k++) {
        const ujSor = bitSor + iranyok[k][0]
        const ujOszlop = bitOszlop + iranyok[k][1]
        if (szabadMezo(ujSor, ujOszlop)) {
            lehetsegesek.push([ujSor, ujOszlop])
        }
    }

    // körbe van zárva, nem tud lépni
    if (lehetsegesek.length === 0) {
        setaMegallitas()
        return
    }

    // okos mód: csak azok a szomszédok maradnak, ahol a legkevesebbszer járt
    if (document.getElementById("f4Okos").checked) {
        let legkevesebb = Infinity
        for (let k = 0; k < lehetsegesek.length; k++) {
            const ertek = latogatas[lehetsegesek[k][0]][lehetsegesek[k][1]]
            if (ertek < legkevesebb) {
                legkevesebb = ertek
            }
        }

        let legjobbak = []
        for (let k = 0; k < lehetsegesek.length; k++) {
            if (latogatas[lehetsegesek[k][0]][lehetsegesek[k][1]] === legkevesebb) {
                legjobbak.push(lehetsegesek[k])
            }
        }
        lehetsegesek = legjobbak
    }

    // véletlen választás a maradék irányok közül
    // (döntetlennél is véletlen, különben mindig ugyanarra fordulna)
    const valasztott = lehetsegesek[Math.floor(Math.random() * lehetsegesek.length)]
    bitSor = valasztott[0]
    bitOszlop = valasztott[1]
    latogatas[bitSor][bitOszlop]++
    lepesSzam++

    kirajzolas()
}


// Indítás / Megállítás gomb
function inditasVagyMegallitas() {
    if (idozito === null) {
        setaInditas()
    } else {
        setaMegallitas()
    }
}


function setaInditas() {
    const sebesseg = Number(document.getElementById("f4Sebesseg").value)
    idozito = setInterval(lepes, sebesseg)
    document.getElementById("f4Indit").textContent = "Megállítás"
}


function setaMegallitas() {
    if (idozito !== null) {
        clearInterval(idozito)
        idozito = null
    }
    const gomb = document.getElementById("f4Indit")
    if (gomb !== null) {
        gomb.textContent = "Indítás"
    }
}


// a csúszka mozgatásakor az új sebesség azonnal érvényes
function sebessegValtozas() {
    const sebesseg = document.getElementById("f4Sebesseg").value
    document.getElementById("f4SebessegKiir").textContent = sebesseg + " ms"

    // a setInterval futás közben nem veszi át az új időt, ezért újraindítjuk
    if (idozito !== null) {
        clearInterval(idozito)
        idozito = setInterval(lepes, Number(sebesseg))
    }
}


// a 4-es gomb bekötése
document.getElementById("feladat4").addEventListener("click", negyedikFeladat)