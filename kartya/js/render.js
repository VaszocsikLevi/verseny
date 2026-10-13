// ============================================================
// render.js — rajzolás. Csak OLVASSA a game állapotát, sosem módosítja.
// Layout: hol vannak a lapok — ezt az input.js is használja a
// kattintás-ellenőrzéshez, így a kettő nem csúszhat el egymástól.
// ============================================================

const Layout = {
    // Egy sor lap középre igazítva, adott y magasságban
    row(count, y) {
        const { CARD_W, CARD_GAP, CANVAS_W } = CONFIG;
        const total = count * CARD_W + (count - 1) * CARD_GAP;
        const startX = (CANVAS_W - total) / 2;
        const rects = [];
        for (let i = 0; i < count; i++) {
            rects.push({ x: startX + i * (CARD_W + CARD_GAP), y: y, w: CARD_W, h: CONFIG.CARD_H });
        }
        return rects;
    },
    humanHand(count) { return Layout.row(count, CONFIG.CANVAS_H - CONFIG.CARD_H - 40); },
    aiHand(count)    { return Layout.row(count, 40); },
    leadSlot()       { return { x: CONFIG.CANVAS_W / 2 - CONFIG.CARD_W - 10, y: 240, w: CONFIG.CARD_W, h: CONFIG.CARD_H }; },
    responseSlot()   { return { x: CONFIG.CANVAS_W / 2 + 10,                 y: 240, w: CONFIG.CARD_W, h: CONFIG.CARD_H }; },
    deckSlot()       { return { x: 60, y: 240, w: CONFIG.CARD_W, h: CONFIG.CARD_H }; },
};

const Renderer = {
    ctx: null,

    init(canvas) {
        this.ctx = canvas.getContext("2d");
    },

    draw(game) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        this.drawTable();

        // Gép keze: hátlap (d) — a játékos csak a saját lapjait látja
        Layout.aiHand(game.ai.hand.length).forEach(r => this.drawCardBack(r));

        // Saját kéz: előlap, a kijátszható lapok kiemelve
        const rects = Layout.humanHand(game.human.hand.length);
        game.human.hand.forEach((card, i) => {
            this.drawCardFace(card, rects[i], game.isPlayable(card));
        });

        // Asztal közepe
        if (game.lead)     this.drawCardFace(game.lead, Layout.leadSlot(), false);
        if (game.response) this.drawCardFace(game.response, Layout.responseSlot(), false);

        // Pakli
        if (!game.deck.isEmpty) {
            this.drawCardBack(Layout.deckSlot());
            this.text(game.deck.count + " lap", 100, 380, 14, "center");
        }

        this.drawScores(game);
        this.text(game.message, CONFIG.CANVAS_W / 2, 220, 20, "center");
    },

    drawTable() {
        const ctx = this.ctx;
        ctx.fillStyle = "#2e6b45";
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    },

    drawCardFace(card, r, highlight) {
        const ctx = this.ctx;
        this.roundRect(r, 8);
        ctx.fillStyle = "#fbf8ef";
        ctx.fill();
        ctx.lineWidth = highlight ? 4 : 1;
        ctx.strokeStyle = highlight ? "#f1c40f" : "#333";
        ctx.stroke();

        // TODO (opcionális): saját kártyaképek drawImage-dzsel.
        // Ha képet használtok, legyen a zip-ben, és relatív úttal töltsétek be.
        ctx.fillStyle = card.suit.color;
        ctx.textAlign = "center";
        ctx.font = "bold 14px Arial";
        ctx.fillText(card.suit.name, r.x + r.w / 2, r.y + 30);
        ctx.font = "bold 22px Arial";
        ctx.fillText(card.rank.label, r.x + r.w / 2, r.y + r.h / 2 + 10);
        ctx.font = "12px Arial";
        ctx.fillStyle = "#555";
        ctx.fillText(card.points + " p", r.x + r.w / 2, r.y + r.h - 12);
    },

    drawCardBack(r) {
        const ctx = this.ctx;
        this.roundRect(r, 8);
        ctx.fillStyle = "#8e2b2b";
        ctx.fill();
        ctx.strokeStyle = "#f2efe6";
        ctx.lineWidth = 2;
        ctx.stroke();
    },

    drawScores(game) {
        // (h) pontok mindkét oldalon
        this.text(game.ai.name + ": " + game.ai.score + " pont", 20, 25, 16, "left");
        this.text(game.human.name + ": " + game.human.score + " pont", 20, CONFIG.CANVAS_H - 12, 16, "left");
        const callerName = game.caller ? game.caller.name : "-";
        this.text("Hívó: " + callerName, CONFIG.CANVAS_W - 20, 25, 16, "right");
    },

    // ---------- segédek ----------

    text(str, x, y, size, align) {
        const ctx = this.ctx;
        ctx.fillStyle = "#f2efe6";
        ctx.font = size + "px Arial";
        ctx.textAlign = align;
        ctx.fillText(str, x, y);
    },

    roundRect(r, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(r.x + radius, r.y);
        ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, radius);
        ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, radius);
        ctx.arcTo(r.x, r.y + r.h, r.x, r.y, radius);
        ctx.arcTo(r.x, r.y, r.x + r.w, r.y, radius);
        ctx.closePath();
    },
};
