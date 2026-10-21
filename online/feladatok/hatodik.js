// 6. feladat – Memória teszt

// a vászon mérete és a körök sugara
const vaszonSzelesseg = 600
const vaszonMagassag = 400
const korSugar = 22
const korTavolsag = 6     // ennyi hely marad legalább két kör között

// a játék állapota
let korok = []            // minden kör: { x, y, szam, kattintva }
let kovetkezoSzam = 1     // erre a számra kell legközelebb kattintani
let szamokLathatok = true // az 1-es után eltűnnek a számok
let jatekFut = false
let kezdesIdeje = 0
let memoriaIdozito = null // a kijelzett idő frissítése


// a feladat betöltése a gombra kattintva
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

    // indul a számláló
    kezdesIdeje = Date.now()
    memoriaIdozitoLeallitas()
    memoriaIdozito = setInterval(idoFrissites, 100)

    uzenetKiiras("Kattints a számokra sorban, 1-től " + darab + "-ig!", "")
}


// körök elhelyezése véletlen helyeken úgy, hogy ne metsszék egymást
function korokGeneralasa(darab) {
    // ha ennyi próbálkozásból nem jön össze, elölről kezdjük
    const maxProba = 1000

    let sikerult = false
    while (!sikerult) {
        korok = []
        let proba = 0

        while (korok.length < darab && proba < maxProba) {
            proba++

            // a kör teljes egészében a vásznon belül legyen
            const x = korSugar + Math.random() * (vaszonSzelesseg - 2 * korSugar)
            const y = korSugar + Math.random() * (vaszonMagassag - 2 * korSugar)

            if (nemUtkozik(x, y)) {
                korok.push({ x: x, y: y, szam: korok.length + 1, kattintva: false })
            }
        }

        sikerult = korok.length === darab
    }
}


// nem metszi-e az új kör a már lerakottakat
function nemUtkozik(x, y) {
    for (let i = 0; i < korok.length; i++) {
        const dx = korok[i].x - x
        const dy = korok[i].y - y
        const tavolsag = Math.sqrt(dx * dx + dy * dy)

        // két kör akkor nem metszi egymást, ha a középpontjaik távolsága
        // nagyobb, mint a két sugár összege
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

        // kitöltés: a már eltalált zöld, a hibás piros, a többi fehér
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

        // szám kiírása, ha még látszanak a számok
        if (szamokLathatok) {
            rajz.fillStyle = "#222"
            rajz.font = "bold 20px Arial"
            rajz.textAlign = "center"
            rajz.textBaseline = "middle"
            rajz.fillText(kor.szam, kor.x, kor.y)
        }
    }
}


// kattintás a vásznon
function memoriaKattintas(esemeny) {
    if (!jatekFut) return

    // az egér helye a vászon koordinátáiban
    // (ha a CSS átméretezi a vásznat, a kettő eltér, ezért arányosítunk)
    const vaszon = document.getElementById("vaszon")
    const hatar = vaszon.getBoundingClientRect()
    const x = (esemeny.clientX - hatar.left) * (vaszon.width / hatar.width)
    const y = (esemeny.clientY - hatar.top) * (vaszon.height / hatar.height)

    // melyik körre kattintott?
    let eltalalt = null
    for (let i = 0; i < korok.length; i++) {
        const dx = korok[i].x - x
        const dy = korok[i].y - y
        if (Math.sqrt(dx * dx + dy * dy) <= korSugar) {
            eltalalt = korok[i]
        }
    }

    // üres helyre kattintott, vagy egy már eltalált körre → nem számít
    if (eltalalt === null || eltalalt.kattintva) return

    // rossz sorrend → vége a játéknak
    if (eltalalt.szam !== kovetkezoSzam) {
        memoriaVege(false, eltalalt)
        return
    }

    // jó kör
    eltalalt.kattintva = true
    kovetkezoSzam++

    // az egyes után eltűnnek a számok
    if (eltalalt.szam === 1) {
        szamokLathatok = false
    }

    korokRajzolasa()

    // mindegyiket eltalálta
    if (kovetkezoSzam > korok.length) {
        memoriaVege(true, null)
    }
}


// a játék vége (siker vagy hiba)
function memoriaVege(siker, hibasKor) {
    jatekFut = false
    memoriaIdozitoLeallitas()
    const ido = ((Date.now() - kezdesIdeje) / 1000).toFixed(1)

    // a végén újra megmutatjuk a számokat
    szamokLathatok = true
    korokRajzolasa(hibasKor)

    if (siker) {
        document.getElementById("idoKiir").textContent = "Idő: " + ido + " mp"
        uzenetKiiras("Gratulálok! Felhasznált idő: " + ido + " másodperc", "siker")
    } else {
        uzenetKiiras("Hiba! A " + kovetkezoSzam + "-es következett volna, de a "
            + hibasKor.szam + "-esre kattintottál. A játék leállt.", "hiba")
    }
}


// a kijelzett idő frissítése
function idoFrissites() {
    const kijelzo = document.getElementById("idoKiir")

    // ha közben másik feladatra váltottak, leállunk
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