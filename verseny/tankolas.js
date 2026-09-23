let tankolasok = [];

function betoltes(){

    if (aktivFeladat === 2) {
        document.getElementById("torzs").innerHTML = "";
        aktivFeladat = null;
        return;
    }
    aktivFeladat = 2;

    document.getElementById("torzs").innerHTML=`    <main>
        <h2>Tankolás nyilvántartó</h2>

        <section id="rogzites">
            <h3>Új tankolás</h3>
            <label for="ujDatum">Dátum</label>
            <input type="date" id="ujDatum">

            <label for="ujLiter">Mennyiség (liter)</label>
            <input type="number" id="ujLiter" step="0.01" min="0">

            <label for="ujOsszeg">Fizetett összeg (Ft)</label>
            <input type="number" id="ujOsszeg" step="1" min="0">

            <label for="ujKm">Kilométeróra (km)</label>
            <input type="number" id="ujKm" step="1" min="0">

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