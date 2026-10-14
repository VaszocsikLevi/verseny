function kattintas(event) {
    const vaszonHelye = vaszon.getBoundingClientRect();

    // A CSS kicsinyítheti a vásznat (pl. telefonon 420 helyett 370 px széles).
    // Ilyenkor a kattintás helyét vissza kell váltani a vászon belső méretére.
    const arany = vaszon.width / vaszonHelye.width;
    const x = (event.clientX - vaszonHelye.left) * arany;
    const y = (event.clientY - vaszonHelye.top) * arany;

    if (y < JATEKOS_SOR_Y || y > JATEKOS_SOR_Y + LAP_MAGAS) {
        return;
    }

    for (let i = 0; i < jatekosKeze.length; i++) {
        const bal = lapX(i, jatekosKeze.length);
        if (x >= bal && x <= bal + LAP_SZELES) {
            jatekosKattintott(i);
            return;
        }
    }
}

// Ha a telefont elforgatják, újratöltjük az oldalt, hogy a megfelelő méretű vászon legyen
let elozoTelefon = TELEFON;
window.addEventListener("resize", function () {
    const mostTelefon = window.innerWidth < 700 && window.innerHeight > window.innerWidth;
    if (mostTelefon !== elozoTelefon) {
        location.reload();
    }
});

//Oldal betöltése után indul a játék
window.addEventListener("load", function () {
    rajzolasIndit();
    vaszon.addEventListener("click", kattintas);
    document.getElementById("ujJatekGomb").addEventListener("click", ujJatek);
    ujJatek();
});
