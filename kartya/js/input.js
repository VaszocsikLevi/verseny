// ============================================================
// input.js — egér. Lefordítja a kattintást "melyik lapra kattintott"-ra,
// és szól a game-nek. Döntést NEM hoz, azt a game.js teszi.
// ============================================================

const Input = {
    init(canvas, game) {
        canvas.addEventListener("click", (event) => {
            const pos = Input.toCanvasPos(canvas, event);
            const rects = Layout.humanHand(game.human.hand.length);

            for (let i = 0; i < rects.length; i++) {
                if (Input.hit(rects[i], pos)) {
                    game.humanPlays(game.human.hand[i]);
                    return;
                }
            }
        });
    },

    // A canvas CSS-ben átméreteződhet, ezért visszaszámoljuk a belső koordinátára
    toCanvasPos(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (canvas.width / rect.width),
            y: (event.clientY - rect.top) * (canvas.height / rect.height),
        };
    },

    hit(r, p) {
        return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    },
};
