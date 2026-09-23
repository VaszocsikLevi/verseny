let tankolasok = [];

function betoltes() {

    if (aktivFeladat === 2) {
        document.getElementById("torzs").innerHTML = "";
        aktivFeladat = null;
        return;
    }
    aktivFeladat = 2;

    document.getElementById("torzs").innerHTML = `    <main>
        <h2>Tankolás nyilvántartó</h2>

        <section id="rogzites">
            <h3>Új tankolás</h3>
            <label for="ujDatum">Dátum</label>
            <input type="date" id="ujDatum">

            <label for="ujLiter">Mennyiség (liter)</label>
            <input type="number" id="ujLiter" step="0.01" min="0" placeholder="50">

            <label for="ujOsszeg">Fizetett összeg (Ft)</label>
            <input type="number" id="ujOsszeg" step="1" min="0" placeholder="20000">

            <label for="ujKm">Kilométeróra (km)</label>
            <input type="number" id="ujKm" step="1" min="0" placeholder="150000">

            <button id="hozzaad">Hozzáadás</button>
            <p id="urlapHiba"></p>
        </section>

        <section id="valaszto">
            <h3>Kimutatások</h3>
            <div id="szuroMezok">
                <label for="szuroEttol">Ettől</label>
                <input type="date" id="szuroEttol">
                <label for="szuroEddig">Eddig</label>
                <input type="date" id="szuroEddig">
            </div>
            <div id="gombsor">
                <button class="nezetGomb aktiv" data-nezet="osszes">Minden tankolás</button>
                <button class="nezetGomb" data-nezet="szurt">Szűrés dátum szerint</button>
                <button class="nezetGomb" data-nezet="havi">Havi költés</button>
                <button class="nezetGomb" data-nezet="rangsor">Rangsor</button>
            </div>
        </section>

        <section class="nezet" id="nezetOsszes">
            <h3>Minden tankolás</h3>
            <table>
                <thead>
                    <tr><th>Dátum</th><th>Liter</th><th>Összeg (Ft)</th><th>Km óra</th><th>Megtett km</th><th>Fogyasztás</th></tr>
                </thead>
                <tbody id="tankolasSorok"></tbody>
            </table>
        </section>

        <section class="nezet rejtve" id="nezetSzurt">
            <h3>Szűrt tankolások</h3>
            <table>
                <thead>
                    <tr><th>Dátum</th><th>Liter</th><th>Összeg (Ft)</th><th>Km óra</th><th>Megtett km</th><th>Fogyasztás</th></tr>
                </thead>
                <tbody id="szurtSorok"></tbody>
            </table>
        </section>

        <section class="nezet rejtve" id="nezetHavi">
            <h3>Havi költés</h3>
            <table>
                <thead>
                    <tr><th>Hónap</th><th>Költés (Ft)</th><th>Tankolás</th></tr>
                </thead>
                <tbody id="haviSorok"></tbody>
            </table>
        </section>

        <section class="nezet rejtve" id="nezetRangsor">
            <h3>Rangsor hatékonyság szerint</h3>
            <table>
                <thead>
                    <tr><th>Helyezés</th><th>Időszak</th><th>Megtett km</th><th>Fogyasztás</th></tr>
                </thead>
                <tbody id="rangsorSorok"></tbody>
            </table>
        </section>
    </main>`;

    tankolasInditas();
}


function tankolasInditas() {

    //Elemek
    const nezetGombok = document.querySelectorAll(".nezetGomb");
    const szuroMezok = document.getElementById("szuroMezok");
    const szuroEttol = document.getElementById("szuroEttol");
    const szuroEddig = document.getElementById("szuroEddig");
    const hiba = document.getElementById("urlapHiba");


    //Számítás
    // Dátum szerint rendez, majd minden tankoláshoz kiszámolja
    // a megtett km-t és a fogyasztást az előző tankolásból.
    function szamolt() {
        const lista = [...tankolasok];
        lista.sort(function (a, b) {
            return a.datum.localeCompare(b.datum);
        });

        return lista.map(function (t, i) {
            if (i === 0) {
                return { ...t, tav: null, fogyasztas: null, elozoDatum: null };
            }
            const tav = t.km - lista[i - 1].km;
            const fogyasztas = tav > 0 ? (t.liter / tav) * 100 : null;
            return {
                ...t,
                tav: tav,
                fogyasztas: fogyasztas,
                elozoDatum: lista[i - 1].datum
            };
        });
    }


    //Kiiras
    function sorHtml(t) {
        const tav = t.tav === null
            ? `<td class="nincs">–</td>`
            : `<td>${t.tav}</td>`;
        const fogy = t.fogyasztas === null
            ? `<td class="nincs">–</td>`
            : `<td>${t.fogyasztas.toFixed(2)} l/100 km</td>`;

        return `<tr>
            <td>${t.datum}</td>
            <td>${t.liter.toFixed(2)}</td>
            <td>${t.osszeg}</td>
            <td>${t.km}</td>
            ${tav}${fogy}
        </tr>`;
    }

    function kirajzolOsszes() {
        const lista = szamolt();

        document.getElementById("tankolasSorok").innerHTML = lista.length === 0
            ? `<tr><td colspan="6" class="nincs">Még nincs rögzített tankolás.</td></tr>`
            : lista.map(sorHtml).join("");
    }

    function kirajzolSzurt() {
        const ettol = szuroEttol.value;
        const eddig = szuroEddig.value;

        const lista = szamolt().filter(function (t) {
            if (ettol !== "" && t.datum < ettol) return false;
            if (eddig !== "" && t.datum > eddig) return false;
            return true;
        });

        document.getElementById("szurtSorok").innerHTML = lista.length === 0
            ? `<tr><td colspan="6" class="nincs">Nincs tankolás ebben az időszakban.</td></tr>`
            : lista.map(sorHtml).join("");
    }

    function kirajzolHavi() {
        const havi = {};

        tankolasok.forEach(function (t) {
            const honap = t.datum.slice(0, 7);
            if (!havi[honap]) {
                havi[honap] = { osszeg: 0, db: 0 };
            }
            havi[honap].osszeg += t.osszeg;
            havi[honap].db += 1;
        });

        const honapok = Object.keys(havi).sort();

        document.getElementById("haviSorok").innerHTML = honapok.length === 0
            ? `<tr><td colspan="3" class="nincs">Még nincs adat.</td></tr>`
            : honapok.map(function (h) {
                return `<tr><td>${h}</td><td>${havi[h].osszeg}</td><td>${havi[h].db} db</td></tr>`;
            }).join("");
    }

    function kirajzolRangsor() {
        const lista = szamolt()
            .filter(function (t) { return t.fogyasztas !== null; })
            .sort(function (a, b) { return a.fogyasztas - b.fogyasztas; });

        document.getElementById("rangsorSorok").innerHTML = lista.length === 0
            ? `<tr><td colspan="4" class="nincs">Legalább két tankolás kell a rangsorhoz.</td></tr>`
            : lista.map(function (t, i) {
                return `<tr>
                    <td>${i + 1}.</td>
                    <td>${t.elozoDatum} → ${t.datum}</td>
                    <td>${t.tav}</td>
                    <td>${t.fogyasztas.toFixed(2)} l/100 km</td>
                </tr>`;
            }).join("");
    }

    function kirajzolMind() {
        kirajzolOsszes();
        kirajzolSzurt();
        kirajzolHavi();
        kirajzolRangsor();
    }


    //Nézetváltás
    function nezetValt(nev) {
        document.querySelectorAll(".nezet").forEach(function (sz) {
            sz.classList.add("rejtve");
        });

        const nagybetus = nev.charAt(0).toUpperCase() + nev.slice(1);
        document.getElementById("nezet" + nagybetus).classList.remove("rejtve");

        nezetGombok.forEach(function (g) {
            g.classList.toggle("aktiv", g.dataset.nezet === nev);
        });

        szuroMezok.style.display = nev === "szurt" ? "block" : "none";
    }

    nezetGombok.forEach(function (gomb) {
        gomb.addEventListener("click", function () {
            nezetValt(gomb.dataset.nezet);
        });
    });


    // Új tankolás rögzítése
    document.getElementById("hozzaad").addEventListener("click", function () {
        const datum = document.getElementById("ujDatum").value;
        const liter = Number(document.getElementById("ujLiter").value);
        const osszeg = Number(document.getElementById("ujOsszeg").value);
        const km = Number(document.getElementById("ujKm").value);

        if (datum === "" || !(liter > 0) || !(osszeg > 0) || !(km > 0)) {
            hiba.textContent = "Minden mezőt ki kell tölteni, pozitív értékekkel.";
            return;
        }

        tankolasok.push({ datum: datum, liter: liter, osszeg: osszeg, km: km });
        hiba.textContent = "";

        document.getElementById("ujDatum").value = "";
        document.getElementById("ujLiter").value = "";
        document.getElementById("ujOsszeg").value = "";
        document.getElementById("ujKm").value = "";

        kirajzolMind();
    });


    // Szűrő mezők
    szuroEttol.addEventListener("change", kirajzolSzurt);
    szuroEddig.addEventListener("change", kirajzolSzurt);


    //Indulás
    nezetValt("osszes");
    kirajzolMind();
}