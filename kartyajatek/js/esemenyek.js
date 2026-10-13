function kattintas(event) {
    const vaszonHelye = vaszon.getBoundingClientRect();
    const x = event.clientX - vaszonHelye.left;
    const y = event.clientY - vaszonHelye.top;

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

//Oldal betöltése után indul a játék
window.addEventListener("load", function () {
    rajzolasIndit();
    vaszon.addEventListener("click", kattintas);
    document.getElementById("ujJatekGomb").addEventListener("click", ujJatek);
    ujJatek();
});
