const mi = [
    { nev: "Kovács Norbert", szoveg: "Kovács Norbert vagyok a Székesfehérvári SzC Széchenyi István Műszaki technikum büszke diákja. A programozással szoktam kitölteni a szabadidőmet, igyekszem a tudásomat naprakészen tartani. Ezek mellett fontos számomra a testmozgás és egészséges életmód." },
    { nev: "Hege Domonkos", szoveg: "Hege Domonkos vagyok és 5 éve foglalkozom informatikával. Mielőtt elkezdtem a tanulmányaimat a Székesfehérvái SZC Széchenyi iskolában, alap fokozaton már tudtam egyszerű html programokat írni, mert már akkor érdekelt az irány." },
    { nev: "Vaszócsik Levente", szoveg: "Vaszócsik Levente vagyok és ez lesz az 5. évem, hogy mélyebben foglalkozok a programozással köszönhetően annek, hogy a Székesfehérvári SzC Széchenyi István Műszaki technikumot választottam tanulmányaim folytatására. Szabadidőm túlnyomó részét is programozással töltöm" }
  ];  
  let aktivFeladat = null;
function Kiir() {
  
    if (aktivFeladat === 1) {
        document.getElementById("torzs").innerHTML = "";
        aktivFeladat = null;
        return;
    }
    aktivFeladat = 1;

    //1.feladat betöltése az indexbe
    document.getElementById("torzs").innerHTML=`<header id="intro">
        <div class="intro-belso">
            <h1>Bit aprítók</h1>
            <ul>
                <li>Anyu kedvencei</li>
            </ul>
            <ul>
                <li>Székesfehérvári SzC Széchenyi István Műszaki Technikumba járunk</li>
                <li>Homolya Zoltán a felkészítő tanárunk</li>
            </ul>
            
            <button id="galeriaGomb">Galéria</button>
        </div>
    </header>

    <main>
        <h2 id="cim">Ismerj meg minket - válassz egy képet</h2>
        <div id="szinpad">        
            <button data-kep="0" class="bal">
                <img src="img/norbert.jpg" alt="Norbi"> 
                <span>Kovács Norbert</span>
            </button>
            <button data-kep="1" class="kozep">
                <img src="img/domi.jpeg" alt="Domi">
                <span>Hege Domonkos</span>
            </button>
            <button data-kep="2" class="jobb">
                <img src="img/vaszo.jpeg" alt="Levi">
                <span>Vaszócsik Levente</span>
            </button>
            <div id="gyuru"></div>
        </div>

        <div id="szoveg"></div>
        <div id="galeria" class="rejtve">
            <button id="elozo">◀</button>
            <img id="galeriaKep" src="" alt="">
            <button id="kovetkezo">▶</button>
            <button id="galeriaVissza">Vissza</button>
        </div>
        
    </main>`

    bemutatkozasInditas();
}

//versenyzők bemutatása
function bemutatkozasInditas() {
    const gombok = document.querySelectorAll("#szinpad button");
    const intro = document.getElementById("intro");
    const gyuru = document.getElementById("gyuru");
    const szoveg = document.getElementById("szoveg");
    const cim = document.getElementById("cim");
    let aktualis = null;

    gombok.forEach(function (gomb) {
        gomb.addEventListener("click", function () {
            const i = Number(gomb.dataset.kep);

            if (i === aktualis) {
                elrejt();
                return;
            }
            aktualis = i;

            gombok.forEach(function (masik) {
                masik.classList.remove("kivalasztott");
                masik.classList.add("halvany");
            });
      
            gomb.classList.remove("halvany");
            gomb.classList.add("kivalasztott");
    
            const jobb = (i + 1) % 3;
            const bal = (i + 2) % 3;
            const valaki = mi[i];
            const uresDb = 7;
            let panelek = "";
        
            for (let k = 0; k < uresDb; k++) {
            panelek += `<div class="panel ures"><span></span><span></span><span></span></div>`;
            }
        
            panelek += `<div class="panel"><h3>${valaki.nev}</h3><p>${valaki.szoveg}</p></div>`;
        
            szoveg.innerHTML = `<div class="szalag">${panelek}</div>`;
        
            const szalag = szoveg.querySelector(".szalag");
            const ido = 1500;
        
            szalag.animate(
            [
                { translate: "0%" },
                { translate: `-${uresDb * 100}%` }
            ],
            {
                duration: ido,
                easing: "cubic-bezier(0.15, 0.85, 0.3, 1.08)",
                fill: "forwards"
            }
            );
        
            szalag.animate(
            [
                { filter: "blur(8px)" },
                { filter: "blur(0px)" }
            ],
            {
                duration: ido * 0.85,
                easing: "ease-in",
                fill: "forwards"
            }
            );
        
            gombok.forEach(function (g) {
            g.classList.remove("bal", "kozep", "jobb");
            });
        
            gombok[i].classList.add("kozep");
            gombok[jobb].classList.add("jobb");
            gombok[bal].classList.add("bal");
        
            console.log("Kép:", gomb.dataset.kep);
            intro.classList.add("felcsuszott");
            gyuru.classList.add("lathato");
            });
      });

        //visszalépés a bemutatásból
        function elrejt() {
            aktualis = null;
            szoveg.innerHTML = "";
            gyuru.classList.remove("lathato");
            intro.classList.remove("felcsuszott");
            const kezdoHelyek = ["bal", "kozep", "jobb"];
            gombok.forEach(function (g, k) {
                g.classList.remove("kivalasztott", "halvany", "bal", "kozep", "jobb");
                g.classList.add(kezdoHelyek[k]);
            });
        } 

        //Galéria
        const kepek = [
            { fajl: "img/IMG_7783.JPG", leiras: "Első kép" },
            { fajl: "img/IMG_7785.JPG", leiras: "Második kép" },
            { fajl: "img/IMG_7788.JPG", leiras: "Harmadik kép" },
            { fajl: "img/IMG_7791.JPG", leiras: "Negyedik kép" },
            { fajl: "img/IMG_7794.JPG", leiras: "Ötödik kép" },
            { fajl: "img/IMG_7796.JPG", leiras: "Hatodik kép" },
            { fajl: "img/IMG_7802.JPG", leiras: "Hetedik kép" },
            ];

            const galeria = document.getElementById("galeria");
            const galeriaKep = document.getElementById("galeriaKep");
            const szinpad = document.getElementById("szinpad");
            let hol = 0;

            function kepMutat() {
            galeriaKep.src = kepek[hol].fajl;
            galeriaKep.alt = kepek[hol].leiras;
            }

            function lep(mennyit) {
            hol = (hol + mennyit + kepek.length) % kepek.length;
            kepMutat();
            }

            document.getElementById("galeriaGomb").addEventListener("click", function () {
            elrejt();
            intro.classList.add("felcsuszott");
            szinpad.classList.add("rejtve");
            szoveg.classList.add("rejtve");
            galeria.classList.remove("rejtve");
            hol = 0;
            kepMutat();
            cim.textContent = "Galéria";
            });

            document.getElementById("galeriaVissza").addEventListener("click", function () {
            galeria.classList.add("rejtve");
            intro.classList.remove("felcsuszott");
            szinpad.classList.remove("rejtve");
            szoveg.classList.remove("rejtve");
            cim.textContent = "Ismerj meg minket - válassz egy képet";
            });

            document.getElementById("kovetkezo").addEventListener("click", function () {
            lep(1);
            });

            document.getElementById("elozo").addEventListener("click", function () {
            lep(-1);
            });

}






