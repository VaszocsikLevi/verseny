// ============================================================
// player.js — egy játékos: kéz + elvitt lapok
// ============================================================

class Player {
    constructor(name, isHuman) {
        this.name = name;
        this.isHuman = isHuman;
        this.hand = [];   // a kezében lévő lapok
        this.won = [];    // az általa elvitt lapok
    }

    addCard(card) {
        if (card) this.hand.push(card);
    }

    removeCard(card) {
        const i = this.hand.indexOf(card);
        if (i !== -1) this.hand.splice(i, 1);
        return card;
    }

    get score() {
        // TODO (h): az elvitt lapok (this.won) pontjainak összege.
        // A Card-on van .points getter. Egy reduce() elég.
        return 0;
    }
}
