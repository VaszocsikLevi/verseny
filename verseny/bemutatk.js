function Kiir() {
    document.getElementById("torzs").innerHTML=`<header id="intro">
        <div class="intro-belso">
            <h1>Ismerjetek meg minket</h1>
            <p>Bit aprítók</p>
            <ul>
                <li>Okosak</li>
                <li>Szépek</li>
                <li>Talpra esettek</li>
                <li>Anyu kedvencei</li>
            </ul>
            <img src="" alt"Apritok">
        </div>
    </header>

    <main>
        <h2>Ismerj meg minket - válassz egy képet</h2>
        <div id="szinpad">        
            <button data-kep="0" class="bal">
                <img src="img/norbi.jpg" alt="Norbi"> 
                <span>Kovács Norbert</span>
            </button>
            <button data-kep="1" class="kozep">
                <img src="img/IMG_6042.jpeg" alt="Domi">
                <span>Hege Domonkos</span>
            </button>
            <button data-kep="2" class="jobb">
                <img src="img/IMG_3869.jpeg" alt="Levi">
                <span>Vaszócsik Levente</span>
            </button>
            <div id="gyuru"></div>
        </div>
        <div id="szoveg"></div>
        
    </main>`
}





const gombok = document.querySelectorAll("#szinpad button");
const intro = document.getElementById("intro");
const gyuru = document.getElementById("gyuru");
const szoveg = document.getElementById("szoveg");
const mi = [
  { nev: "Kovács Norbert", szoveg: "Kovács Norbert vagyok a Székesfehérvári SzC Széchenyi István Műszaki technikum büszke diákja. A programozással szoktam kitölteni a szabadidőmet, igyekszem a tudásomat naprakészen tartani. Ezek mellett fontos számomra a testmozgás és egészséges életmód." },
  { nev: "Hege Domonkos", szoveg: "Hege Domonkos vagyok és 5 éve foglalkozom informatikával. Mielőtt elkezdtem a tanulmányaimat a Székesfehérvái SZC Széchenyi iskolában, alap fokozaton már tudtam egyszerű html programokat írni, mert már akkor érdekelt az irány." },
  { nev: "Vaszócsik Levente", szoveg: "Vaszócsik Levente vagyok és ez lesz az 5. évem, hogy mélyebben foglalkozok a programozással köszönhetően annek, hogy a Székesfehérvári SzC Széchenyi István Műszaki technikumot választottam tanulmányaim folytatására. Szabadidőm túlnyomó részét is programozással töltöm" }
];


gombok.forEach(function (gomb) {
  gomb.addEventListener("click", function () {

    gombok.forEach(function (masik) {
      masik.classList.remove("kivalasztott");
      masik.classList.add("halvany");
    });

    gomb.classList.remove("halvany");
    gomb.classList.add("kivalasztott");

    const i = Number(gomb.dataset.kep);
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

    document.innerHTML = `<button class="vissza">Vissza a tetejére</button>`;

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

