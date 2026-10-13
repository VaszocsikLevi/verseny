// ============================================================
// rules.js — a játékszabály. TISZTA függvények: nem rajzolnak,
// nem módosítanak állapotot. Így a gép és az ember UGYANAZT
// a szabályt használja, és könnyű tesztelni a konzolban.
// ============================================================

const Rules = {

    // Üti-e a `response` a `lead`-et?
    canBeat(lead, response) {
        // TODO (e): a feladat szerint üt, ha
        //   - ugyanolyan értékű (rank), VAGY
        //   - ugyanolyan színű ÉS nagyobb értékű (strength).
        // Konzolos teszthez: Rules.canBeat(new Card(SUITS[0], RANKS[0]), new Card(SUITS[0], RANKS[3]))
        return false;
    },

    // Mit tehet rá a nem hívó játékos? (f + i)
    // Ha van ütő lapja, csak azok közül választhat; ha nincs, bármit.
    legalResponses(hand, lead) {
        const beating = hand.filter(card => Rules.canBeat(lead, card));
        return beating.length > 0 ? beating : hand;
    },

    // Ki viszi a kört?
    trickWinner(lead, response, caller, other) {
        return Rules.canBeat(lead, response) ? other : caller;
    },
};
