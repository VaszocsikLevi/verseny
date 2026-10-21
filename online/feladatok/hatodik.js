const vaszonSzelesseg = 600
const vaszonMagassag = 400
const korSugar = 22
const korTavolsag = 6  

// a játék állapota
let korok = []            
let kovetkezoSzam = 1     
let szamokLathatok = true 
let jatekFut = false
let kezdesIdeje = 0
let memoriaIdozito = null 

// a feladat betöltése 
function hatodikFeladat() {
    memoriaIdozitoLeallitas()
    jatekFut = false

    document.getElementById("torzs").innerHTML = `
    <div id="memoria">
        <h2>Memória teszt</h2>

        <div id="memoriaBeallitas">
            <label for="korDarab">Körök száma:</label>
            <select id="korDarab">
                <option value="5">5 – könnyű</option>
                <option value="6">6</option>
                <option value="7" selected>7 – közepes</option>
                <option value="8">8</option>
                <option value="9">9 – nehéz</option>
            </select>
            <button id="memoriaIndit">Indítás</button>
        </div>

        <p id="idoKiir">Idő: 0.0 mp</p>

        <canvas id="vaszon" width="${vaszonSzelesseg}" height="${vaszonMagassag}"></canvas>

        <p id="memoriaUzenet">Válaszd ki a körök számát, és nyomd meg az Indítás gombot!</p>
    </div>`

    document.getElementById("memoriaIndit").addEventListener("click", memoriaInditas)
    document.getElementById("vaszon").addEventListener("click", memoriaKattintas)

    korok = []
    korokRajzolasa()
}


// új játék indítása
function memoriaInditas() {
    const darab = Number(document.getElementById("korDarab").value)

    korokGeneralasa(darab)
    kovetkezoSzam = 1
    szamokLathatok = true
    jatekFut = true
    korokRajzolasa()

    kezdesIdeje = Date.now()
    memoriaIdozitoLeallitas()
    memoriaIdozito = setInterval(idoFrissites, 100)

    uzenetKiiras("Kattints a számokra sorban, 1-től " + darab + "-ig!", "")
}


// körök elhelyezése véletlen helyeken úgy, hogy ne metsszék egymást
function korokGeneralasa(darab) {
    const maxProba = 1000

    let sikerult = false
    while (!sikerult) {
        korok = []
        let proba = 0

        while (korok.length < darab && proba < maxProba) {
            proba++

            const x = korSugar + Math.random() * (vaszonSzelesseg - 2 * korSugar)
            const y = korSugar + Math.random() * (vaszonMagassag - 2 * korSugar)

            if (nemUtkozik(x, y)) {
                korok.push({ x: x, y: y, szam: korok.length + 1, kattintva: false })
            }
        }

        sikerult = korok.length === darab
    }
}


// lerakkott körök ütközésének vizsgálata
function nemUtkozik(x, y) {
    for (let i = 0; i < korok.length; i++) {
        const dx = korok[i].x - x
        const dy = korok[i].y - y
        const tavolsag = Math.sqrt(dx * dx + dy * dy)

        if (tavolsag < 2 * korSugar + korTavolsag) {
            return false
        }
    }
    return true
}


// a vászon újrarajzolása
function korokRajzolasa(hibasKor) {
    const vaszon = document.getElementById("vaszon")
    if (vaszon === null) return
    const rajz = vaszon.getContext("2d")

    rajz.clearRect(0, 0, vaszonSzelesseg, vaszonMagassag)

    for (let i = 0; i < korok.length; i++) {
        const kor = korok[i]

        rajz.beginPath()
        rajz.arc(kor.x, kor.y, korSugar, 0, 2 * Math.PI)
        if (kor === hibasKor) {
            rajz.fillStyle = "#e74c3c"
        } else if (kor.kattintva) {
            rajz.fillStyle = "#7bc67e"
        } else {
            rajz.fillStyle = "#ffffff"
        }
        rajz.fill()
        rajz.lineWidth = 2
        rajz.strokeStyle = "#222"
        rajz.stroke()

        if (szamokLathatok) {
            rajz.fillStyle = "#222"
            rajz.font = "bold 20px Arial"
            rajz.textAlign = "center"
            rajz.textBaseline = "middle"
            rajz.fillText(kor.szam, kor.x, kor.y)
        }
    }
}


// kattintás a vászonon
function memoriaKattintas(esemeny) {
    if (!jatekFut) return

    const vaszon = document.getElementById("vaszon")
    const hatar = vaszon.getBoundingClientRect()
    const x = (esemeny.clientX - hatar.left) * (vaszon.width / hatar.width)
    const y = (esemeny.clientY - hatar.top) * (vaszon.height / hatar.height)

    let eltalalt = null
    for (let i = 0; i < korok.length; i++) {
        const dx = korok[i].x - x
        const dy = korok[i].y - y
        if (Math.sqrt(dx * dx + dy * dy) <= korSugar) {
            eltalalt = korok[i]
        }
    }

    if (eltalalt === null || eltalalt.kattintva) return

    if (eltalalt.szam !== kovetkezoSzam) {
        memoriaVege(false, eltalalt)
        return
    }

    eltalalt.kattintva = true
    kovetkezoSzam++

    if (eltalalt.szam === 1) {
        szamokLathatok = false
    }

    korokRajzolasa()

    if (kovetkezoSzam > korok.length) {
        memoriaVege(true, null)
    }
}

// játék vége
function memoriaVege(siker, hibasKor) {
    jatekFut = false
    memoriaIdozitoLeallitas()
    const ido = ((Date.now() - kezdesIdeje) / 1000).toFixed(1)

    szamokLathatok = true
    korokRajzolasa(hibasKor)

    if (siker) {
        document.getElementById("idoKiir").textContent = "Idő: " + ido + " mp"
        uzenetKiiras("Gratulálok! Felhasznált idő: " + ido + " másodperc", "siker")
    } else {
        uzenetKiiras("A " + kovetkezoSzam + "-es következett volna, de a "
            + hibasKor.szam + "-esre kattintottál.", "hiba")
    }
}


// a kijelzett idő frissítése
function idoFrissites() {
    const kijelzo = document.getElementById("idoKiir")

    if (kijelzo === null) {
        memoriaIdozitoLeallitas()
        jatekFut = false
        return
    }

    const ido = ((Date.now() - kezdesIdeje) / 1000).toFixed(1)
    kijelzo.textContent = "Idő: " + ido + " mp"
}


function memoriaIdozitoLeallitas() {
    if (memoriaIdozito !== null) {
        clearInterval(memoriaIdozito)
        memoriaIdozito = null
    }
}


// üzenet a vászon alatt, osztállyal a színezéshez
function uzenetKiiras(szoveg, osztaly) {
    const uzenet = document.getElementById("memoriaUzenet")
    uzenet.textContent = szoveg
    uzenet.className = osztaly
}


// gomb bekötése
document.getElementById("feladat6").addEventListener("click", hatodikFeladat)