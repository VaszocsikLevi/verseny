class Card {
    constructor(suit, rank) {
        this.suit = suit;   // SUITS egyik eleme
        this.rank = rank;   // RANKS egyik eleme
    }

    get strength() { return this.rank.strength; }
    get points()   { return this.rank.points; }
    get label()    { return this.suit.name + " " + this.rank.label; }
}

class Deck {
    constructor() {
        this.cards = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.cards.push(new Card(suit, rank));
            }
        }
        // 4 szín × 8 érték = 32 lap
    }

    shuffle() {
        // TODO (c): keverés.
        // Tipp: Fisher–Yates. Hátulról indulsz, minden i-hez választasz egy
        // véletlen j-t 0..i között, és felcseréled a cards[i]-t és cards[j]-t.
        // NE használd a sort(() => Math.random() - 0.5) trükköt — nem egyenletes.
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Elemek felcserélése destruktúrálással
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.length > 0 ? this.cards.pop() : null;
    }

    get isEmpty() { return this.cards.length === 0; }
    get count()   { return this.cards.length; }
}
