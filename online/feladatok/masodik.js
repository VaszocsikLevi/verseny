let szekek = []           
let aktualisJatekos = 1
let tiltottSzekek = []    
let szekJatekVege = false


// a feladat betöltése a gombra kattintva
function masodikFeladat() {
    document.getElementById("torzs").innerHTML = `
    <div id="szekJatek">
        <h2>Távolsági székfoglaló</h2>

        <div id="szekBeallitas">
            <label for="szekDarab">Székek száma (10–20):</label>
            <input type="number" id="szekDarab" min="10" max="20" value="12">
            <button id="ujJatekGomb">Új játék</button>
        </div>

        <p id="kovetkezoJatekos"></p>

        <div id="szekSor"></div>

        <div id="pontAllas">
            <div class="jatekosDoboz egyes">1. játékos: <span id="pont1">0</span></div>
            <div class="jatekosDoboz kettes">2. játékos: <span id="pont2">0</span></div>
        </div>

        <p id="szekEredmeny"></p>
    </div>`

    document.getElementById("ujJatekGomb").addEventListener("click", szekJatekInditas)
    document.getElementById("szekSor").addEventListener("click", szekKattintas)

    szekJatekInditas()
}


// új játék
function szekJatekInditas() {
    let darab = Number(document.getElementById("szekDarab").value)

    if (darab < 10 || isNaN(darab)) darab = 10
    if (darab > 20) darab = 20
    document.getElementById("szekDarab").value = darab

    szekek = []
    for (let i = 0; i < darab; i++) {
        const ertek = Math.floor(Math.random() * 11) + 5
        szekek.push({ ertek: ertek, foglalo: 0 })
    }

    aktualisJatekos = 1
    tiltottSzekek = []
    szekJatekVege = false
    document.getElementById("szekEredmeny").textContent = ""

    szekekRajzolasa()
}


// a székek kirajzolása
function szekekRajzolasa() {
    const sor = document.getElementById("szekSor")
    sor.innerHTML = ""

    for (let i = 0; i < szekek.length; i++) {
        const szek = document.createElement("div")
        szek.classList.add("szek")
        szek.dataset.index = i

        if (szekek[i].foglalo === 1) {
            szek.classList.add("foglalt1")
            szek.innerHTML = szekek[i].ertek + "<small>1. játékos</small>"
        } else if (szekek[i].foglalo === 2) {
            szek.classList.add("foglalt2")
            szek.innerHTML = szekek[i].ertek + "<small>2. játékos</small>"
        } else {
            szek.textContent = szekek[i].ertek
            if (!szekJatekVege && tiltottSzekek.includes(i)) {
                szek.classList.add("tiltott")
            }
        }

        sor.appendChild(szek)
    }

    document.getElementById("pont1").textContent = pontszam(1)
    document.getElementById("pont2").textContent = pontszam(2)

    const kovetkezo = document.getElementById("kovetkezoJatekos")
    if (szekJatekVege) {
        kovetkezo.textContent = "Vége a játéknak"
        kovetkezo.className = ""
    } else {
        kovetkezo.textContent = aktualisJatekos + ". játékos következik"
        kovetkezo.className = aktualisJatekos === 1 ? "egyes" : "kettes"
    }
}


// kattintás egy székre
function szekKattintas(esemeny) {
    if (szekJatekVege) return

    const szek = esemeny.target.closest(".szek")
    if (szek === null) return

    const index = Number(szek.dataset.index)

    if (!foglalhato(index)) return

    szekek[index].foglalo = aktualisJatekos

    tiltottSzekek = [index - 1, index + 1]

    aktualisJatekos = aktualisJatekos === 1 ? 2 : 1

    if (!vanFoglalhatoSzek()) {
        szekJatekVege = true
        szekekRajzolasa()
        szekJatekLezaras()
        return
    }

    szekekRajzolasa()
}


// lefoglalhatja-e az aktuális játékos ezt a széket
function foglalhato(index) {
    if (szekek[index].foglalo !== 0) return false      
    if (tiltottSzekek.includes(index)) return false     
    return true
}


// van-e még foglalható szék a játékosnak
function vanFoglalhatoSzek() {
    for (let i = 0; i < szekek.length; i++) {
        if (foglalhato(i)) return true
    }
    return false
}


// egy játékos által foglalt székek összértéke
function pontszam(jatekos) {
    let osszeg = 0
    for (let i = 0; i < szekek.length; i++) {
        if (szekek[i].foglalo === jatekos) {
            osszeg += szekek[i].ertek
        }
    }
    return osszeg
}


// eredmény kiírása a játék végén
function szekJatekLezaras() {
    const egyes = pontszam(1)
    const kettes = pontszam(2)

    let szoveg = "Nem lehet több széket foglalni. "
    szoveg += "1. játékos: " + egyes + " pont, 2. játékos: " + kettes + " pont. "

    if (egyes > kettes) {
        szoveg += "Az 1. játékos nyert!"
    } else if (kettes > egyes) {
        szoveg += "A 2. játékos nyert!"
    } else {
        szoveg += "Döntetlen!"
    }

    document.getElementById("szekEredmeny").textContent = szoveg
}


// a 2-es gomb bekötése
document.getElementById("feladat2").addEventListener("click", masodikFeladat)