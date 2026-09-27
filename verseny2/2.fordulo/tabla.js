const nsor = 15;
const noszlop = 15;
let matrix = []
const gyumolcsok = ["alma", "szőlő", "körte"]

//jatekos pozicioja
let jatekosSor = null
let jatekosOszlop = null
let jatekos = "🕺🏻"

//játéktér
const jatekter = document.getElementById("jatekter")
let ujszam = 1;

//tábla létrehozása
for (let i = 0; i < nsor; i++) {
    const ujSor = jatekter.insertRow(-1)
    matrix[i] = []

    for (let j = 0; j < noszlop; j++) {
        const ujCella = ujSor.insertCell(-1)

        //koordináta tárolása html elemben
        ujCella.dataset.sor = i
        ujCella.dataset.oszlop = j

        if (Math.random() < 0.2) {
            const randomGyumolcs = gyumolcsok[Math.floor(Math.random() * gyumolcsok.length)]
            matrix[i][j] = randomGyumolcs
            ujCella.textContent = randomGyumolcs
        }
        else {
            matrix[i][j] = " "
            ujCella.textContent = " "
        }
        ujszam++
    }
}

//játékossal lépés
jatekter.addEventListener("click", function (event) {
    const cella = event.target

    //ellenőrzés hogy cellára kattintott-e
    if (cella.tagName === "TD") {
        const celSor = Number(cella.dataset.sor)
        const celOszlop = Number(cella.dataset.oszlop)

        //van-e gyümölcs a mezőn
        const ertekAMezon = matrix[celSor][celOszlop]
        const vanGyumolcs = gyumolcsok.includes(ertekAMezon)

        // ha nincs gyumolcs a mezon nem tud lépni a játékos
        if (!vanGyumolcs) {
            alert("Nincs gyümölcs a mezőn!")
            return
        }

        //kezdőhely választása  
        if (jatekosSor === null && jatekosOszlop === null) {
            jatekosSor = celSor
            jatekosOszlop = celOszlop
            matrix[celSor][celOszlop] = jatekos
            cella.textContent = jatekos
            return
        }

        //lépegetés
        //régi hely érték csökkentése
        matrix[jatekosSor][jatekosOszlop] = " "
        const regiCella = jatekter.rows[jatekosSor].cells[jatekosOszlop]
        regiCella.textContent = " "

        //uj hely elfoglalasa
        jatekosSor = celSor
        jatekosOszlop = celOszlop
        matrix[celSor][celOszlop] = jatekos
        cella.textContent = jatekos
    }
})

