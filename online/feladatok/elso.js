function betoltes() {

    const torzs = document.getElementById("torzs");
    torzs.innerHTML = `<h2>Relatív prím számok</h2>

<input type="number" id="szam" min="2" max="100">
<button onclick="szamolas()">Számolás</button>

<p id="eredmeny"></p>`;
       
       
    }



function szamolas() {
    let szam = Number(document.getElementById("szam").value);
    let eredmeny = document.getElementById("eredmeny");

    if (szam < 2 || szam > 100 || !Number.isInteger(szam)) {
        eredmeny.innerHTML = "Hibás szám! 2 és 100 között adj meg egy egész számot!";
        return;
    }

    let lista = [];

    for (let i = 2; i <= 100; i++) {
        let a = szam;
        let b = i;

        while (b != 0) {
            let maradek = a % b;
            a = b;
            b = maradek;
        }

        if (a == 1) {
            lista.push(i);
        }
    }

    eredmeny.innerHTML = "Relatív prím számok: " + lista.join(", ");
}