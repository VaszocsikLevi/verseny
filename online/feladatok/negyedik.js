const meret = 10
const falArany = 0.2   

// generáláskor betöltjük az aktuális térképet és bit kezdőhelyét
let terkep = []
let kezdoSor = 0
let kezdoOszlop = 0

// a séta állapota
let latogatas = []      
let bitSor = kezdoSor
let bitOszlop = kezdoOszlop
let lepesSzam = 0
let idozito = null      

// a 4 lehetséges irány
const iranyok = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
]

// a feladat betöltése a gombra kattintva
function negyedikFeladat() {
    setaMegallitas()

    document.getElementById("torzs").innerHTML = `
    <div id="seta">
        <h2>Véletlenszerű séta</h2>

        <div id="setaGombok">
            <button id="inditGomb">Indítás</button>
            <button id="lepesGomb">Egy lépés</button>
            <button id="ujraGomb">Újrakezdés</button>
            <button id="ujTerkepGomb">Új térkép</button>
            <label for="setaSebesseg">Lépésköz:</label>
            <input type="range" id="setaSebesseg" min="50" max="1000" step="50" value="300">
            <span id="sebessegKiir">300 ms</span>

            <label>
                <input type="checkbox" id="okosMod" checked>
                Kevésbé bejárt mező előnyben
            </label>
        </div>

        <table id="terkepTabla"></table>

        <p id="statisztika"></p>
    </div>`

    document.getElementById("inditGomb").addEventListener("click", inditasVagyMegallitas)
    document.getElementById("lepesGomb").addEventListener("click", lepes)
    document.getElementById("ujraGomb").addEventListener("click", ujrakezdes)
    document.getElementById("setaSebesseg").addEventListener("input", sebessegValtozas)
    document.getElementById("ujTerkepGomb").addEventListener("click", ujTerkep)
    ujTerkep()
}

// új, véletlen falakkal generált térkép
function ujTerkep() {
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

// szabad mezők elérhetőségének vizsgálása
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

// séta visszaállítása a kezdőállapotba
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

    // a kezdőmezőn már ott áll a bit
    latogatas[bitSor][bitOszlop] = 1

    tablaLetrehozas()
    kirajzolas()
}

// a táblázat celláinak létrehozása
function tablaLetrehozas() {
    const tabla = document.getElementById("terkepTabla")
    tabla.innerHTML = ""

    for (let i = 0; i < terkep.length; i++) {
        const ujSor = tabla.insertRow(-1)
        for (let j = 0; j < terkep[i].length; j++) {
            const ujCella = ujSor.insertCell(-1)
            ujCella.dataset.sor = i
            ujCella.dataset.oszlop = j
        }
    }
}

// a térkép frissítése a jelenlegi állapot alapján
function kirajzolas() {
    const tabla = document.getElementById("terkepTabla")
    let bejartMezok = 0
    let szabadMezok = 0

    for (let i = 0; i < terkep.length; i++) {
        for (let j = 0; j < terkep[i].length; j++) {
            const cella = tabla.rows[i].cells[j]
            cella.className = ""

            if (terkep[i][j] === 1) {
                cella.classList.add("fal")
                cella.textContent = ""
                continue
            }

            szabadMezok++
            if (latogatas[i][j] > 0) {
                bejartMezok++
                cella.classList.add("bejart")
            }
            if (i === bitSor && j === bitOszlop) {
                cella.classList.add("bit")
            }

            cella.textContent = latogatas[i][j]
        }
    }
    document.getElementById("statisztika").textContent =
        "Lépések: " + lepesSzam + " | Felfedezett mezők: " + bejartMezok + " / " + szabadMezok

    if (bejartMezok === szabadMezok) {
        setaMegallitas()
        document.getElementById("f4Statisztika").textContent += " – A térkép felderítve!"
    }
}

// léphet-e a bit erre a mezőre
function szabadMezo(sor, oszlop) {
    if (sor < 0 || sor >= terkep.length) return false
    if (oszlop < 0 || oszlop >= terkep[0].length) return false
    return terkep[sor][oszlop] === 0
}

// egy lépés a séta során
function lepes() {
    if (document.getElementById("terkepTabla") === null) {
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

    // csak azok a szomszédok maradnak, ahol a legkevesebbszer járt
    if (document.getElementById("okosMod").checked) {
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
    const valasztott = lehetsegesek[Math.floor(Math.random() * lehetsegesek.length)]
    bitSor = valasztott[0]
    bitOszlop = valasztott[1]
    latogatas[bitSor][bitOszlop]++
    lepesSzam++

    kirajzolas()
}

// Indítás / Megállítás 
function inditasVagyMegallitas() {
    if (idozito === null) {
        setaInditas()
    } else {
        setaMegallitas()
    }
}

function setaInditas() {
    const sebesseg = Number(document.getElementById("setaSebesseg").value)
    idozito = setInterval(lepes, sebesseg)
    document.getElementById("inditGomb").textContent = "Megállítás"
}

function setaMegallitas() {
    if (idozito !== null) {
        clearInterval(idozito)
        idozito = null
    }
    const gomb = document.getElementById("inditGomb")
    if (gomb !== null) {
        gomb.textContent = "Indítás"
    }
}

// sebesség változtatása
function sebessegValtozas() {
    const sebesseg = document.getElementById("setaSebesseg").value
    document.getElementById("sebessegKiir").textContent = sebesseg + " ms"

    if (idozito !== null) {
        clearInterval(idozito)
        idozito = setInterval(lepes, Number(sebesseg))
    }
}

// gomb bekötése
document.getElementById("feladat4").addEventListener("click", negyedikFeladat)