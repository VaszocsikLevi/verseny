const Gep = {
    chooseLead(hand) {
        // TODO (i): stratégia. Ötletek egyszerűtől okosabbig:
        //   - véletlen lap
        //   - a legkisebb pontértékű lapot hívja (ne kockáztasson pontot)
        //   - olyat hív, amire a kevés megmaradt lap miatt nehéz ütni
        return hand[0];
    },

    // Az ember hívott, a gép tesz rá.
    chooseResponse(hand, lead) {
        const legal = Rules.legalResponses(hand, lead);
        // TODO (i): stratégia. Pl. ha üthet, a leggyengébb ütő lappal üssön;
        // ha nem üthet, a legkevesebb pontot érőt dobja el.
        return legal[0];
    },
};
