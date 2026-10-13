// ============================================================
// esemenyek.js – egér, gomb, és a program indítása
// Magyarázat: MAGYARAZAT.md 5. pont
// ============================================================

function kattintas(event) {
    // Az egér helyét átszámoljuk a vászonhoz képest (mint a tananyagban)
    var vaszonHelye = vaszon.getBoundingClientRect();
    var x = event.clientX - vaszonHelye.left;
    var y = event.clientY - vaszonHelye.top;

    // Ha nem a saját lapjaink sorában kattintott, nem érdekes
    if (y < JATEKOS_SOR_Y || y > JATEKOS_SOR_Y + LAP_MAGAS) {
        return;
    }

    // Megnézzük, melyik lapra esett a kattintás
    for (var i = 0; i < jatekosKeze.length; i++) {
        var bal = lapX(i, jatekosKeze.length);
        if (x >= bal && x <= bal + LAP_SZELES) {
            jatekosKattintott(i);
            return;
        }
    }
}

// Akkor indul, amikor az oldal teljesen betöltődött
window.addEventListener("load", function () {
    rajzolasIndit();
    vaszon.addEventListener("click", kattintas);
    document.getElementById("ujJatekGomb").addEventListener("click", ujJatek);
    ujJatek();
});
