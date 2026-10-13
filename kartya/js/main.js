// ============================================================
// main.js — belépési pont. Összeköti a részeket és elindítja a rajzolást.
// ============================================================

window.addEventListener("load", () => {
    const canvas = document.getElementById("jatekter");
    Renderer.init(canvas);

    const game = new Game();
    Input.init(canvas, game);

    document.getElementById("ujJatek").addEventListener("click", () => game.reset());

    // Rajzolási ciklus. A tananyag setInterval-t használ — az is jó;
    // a requestAnimationFrame a böngésző képfrissítéséhez igazodik.
    function loop() {
        Renderer.draw(game);
        requestAnimationFrame(loop);
    }
    loop();

    // Debughoz a konzolból: game.human.hand, Rules.canBeat(...)
    window.game = game;
});
