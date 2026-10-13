// ============================================================
// game.js — a játékmenet állapotgépe.
// Ez dönti el, ki jön, mikor ér véget a kör és a játék.
// Nem rajzol (render.js) és nem figyel egeret (input.js).
// ============================================================

class Game {
    constructor() {
        this.generation = 0;
        this.reset();
    }

    reset() {
        // Az "Új játék" gomb után a régi setTimeout-ok ne lépjenek bele az új játékba.
        this.generation++;

        this.deck = new Deck();
        this.deck.shuffle();

        this.human = new Player("Te", true);
        this.ai = new Player("Gép", false);

        this.lead = null;       // a hívó lapja az asztalon
        this.response = null;   // a ráadott lap
        this.message = "";
        this.phase = null;

        this.deal();

        // (b) véletlenszerű kezdő
        this.caller = Math.random() < 0.5 ? this.human : this.ai;
        this.startTrick();
    }

    get other() {
        return this.caller === this.human ? this.ai : this.human;
    }

    // (c) 4-4 lap
    deal() {
        for (let i = 0; i < CONFIG.HAND_SIZE; i++) {
            this.human.addCard(this.deck.draw());
            this.ai.addCard(this.deck.draw());
        }
    }

    startTrick() {
        this.lead = null;
        this.response = null;

        if (this.human.hand.length === 0 && this.ai.hand.length === 0) {
            this.endGame();
            return;
        }

        if (this.caller === this.human) {
            this.phase = PHASE.HUMAN_LEAD;
            this.message = "Te hívsz – válassz egy lapot.";
        } else {
            this.phase = PHASE.AI_LEAD;
            this.message = "A gép hív…";
            this.later(() => this.aiLead(), CONFIG.AI_DELAY_MS);
        }
    }

    // ---------- Ember lépései (az input.js hívja) ----------

    humanPlays(card) {
        if (this.phase === PHASE.HUMAN_LEAD) {
            this.lead = this.human.removeCard(card);
            this.phase = PHASE.AI_RESPOND;
            this.message = "A gép gondolkodik…";
            this.later(() => this.aiRespond(), CONFIG.AI_DELAY_MS);
        }
        else if (this.phase === PHASE.HUMAN_RESPOND) {
            // (f) ha tud ütni, csak ütő lapot tehet
            if (!this.isPlayable(card)) {
                this.message = "Ütnöd kell! Válassz a kiemelt lapok közül.";
                return;
            }
            this.response = this.human.removeCard(card);
            this.resolveTrick();
        }
        // minden más fázisban a kattintást figyelmen kívül hagyjuk
    }

    // A render.js is ezt használja a kiemeléshez.
    isPlayable(card) {
        if (this.phase === PHASE.HUMAN_LEAD) return true;
        if (this.phase === PHASE.HUMAN_RESPOND) {
            return Rules.legalResponses(this.human.hand, this.lead).includes(card);
        }
        return false;
    }

    // ---------- Gép lépései ----------

    aiLead() {
        const card = AI.chooseLead(this.ai.hand);
        this.lead = this.ai.removeCard(card);
        this.phase = PHASE.HUMAN_RESPOND;
        this.message = "A gép hívott – tegyél rá egy lapot.";
    }

    aiRespond() {
        const card = AI.chooseResponse(this.ai.hand, this.lead);
        this.response = this.ai.removeCard(card);
        this.resolveTrick();
    }

    // ---------- Kör vége ----------

    resolveTrick() {
        const winner = Rules.trickWinner(this.lead, this.response, this.caller, this.other);
        winner.won.push(this.lead, this.response);
        this.caller = winner;   // aki vitte, az hív
        this.phase = PHASE.TRICK_DONE;
        this.message = winner.name + " vitte a kört.";

        this.later(() => {
            this.drawCards();
            this.startTrick();
        }, CONFIG.TRICK_PAUSE_MS);
    }

    // (g) kör után húzás, ha van még lap
    drawCards() {
        // TODO (g): ha a pakli nem üres, mindkét játékos húz egy lapot.
        // Kérdés, amit el kell döntenetek: ki húz először? (Szokás: aki vitte.)
        // this.caller már a nyertes. Deck.draw() null-t ad, ha üres — addCard ezt elnyeli.
    }

    endGame() {
        this.phase = PHASE.GAME_OVER;
        // TODO (j): győztes és végső pontszámok kihirdetése.
        // this.human.score, this.ai.score — döntetlenre is gondoljatok!
        this.message = "Vége a játéknak.";
    }

    // ---------- Segéd ----------

    // setTimeout, ami "Új játék" után már nem fut le
    later(fn, ms) {
        const gen = this.generation;
        setTimeout(() => { if (gen === this.generation) fn(); }, ms);
    }
}
