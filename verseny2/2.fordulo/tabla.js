const nsor = 15;
const noszlop = 15;
let matrix = []
const gyumolcsok = ["alma", "szőlő", "körte"]

const jatekter = document.getElementById("jatekter")
let ujszam = 1;
for (let i = 0; i < nsor; i++) {
    const ujSor = jatekter.insertRow(-1)
    matrix[i] = []
    for (let j = 0; j < noszlop; j++) {
        const ujCella = ujSor.insertCell(-1)
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

