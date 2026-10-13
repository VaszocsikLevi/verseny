// ============================================================
// config.js — konstansok. Itt NINCS logika, csak adat.
// ============================================================

const CONFIG = {
    CANVAS_W: 900,
    CANVAS_H: 600,
    CARD_W: 80,
    CARD_H: 120,
    CARD_GAP: 16,
    HAND_SIZE: 4,
    AI_DELAY_MS: 900,      // ennyit "gondolkodik" a gép, hogy látható legyen, mi történik
    TRICK_PAUSE_MS: 1400,  // ennyi ideig marad az asztalon a két lap a kör végén
};

// Magyar kártya színei
const SUITS = [
    { id: "piros", name: "Piros", color: "#c0392b" },
    { id: "tok",   name: "Tök",   color: "#e67e22" },
    { id: "zold",  name: "Zöld",  color: "#27ae60" },
    { id: "makk",  name: "Makk",  color: "#7a5230" },
];

// strength: az ütéshez (nagyobb üti a kisebbet)
// points:   a végső számoláshoz (figurás lap = 0)
const RANKS = [
    { id: "VII",  label: "VII",    strength: 1, points: 7 },
    { id: "VIII", label: "VIII",   strength: 2, points: 8 },
    { id: "IX",   label: "IX",     strength: 3, points: 9 },
    { id: "X",    label: "X",      strength: 4, points: 10 },
    { id: "ALSO", label: "Alsó",   strength: 5, points: 0 },
    { id: "FELSO",label: "Felső",  strength: 6, points: 0 },
    { id: "KIR",  label: "Király", strength: 7, points: 0 },
    { id: "ASZ",  label: "Ász",    strength: 8, points: 0 },
];

// A játék állapotai. A game.js ezek között lépked.
const PHASE = {
    HUMAN_LEAD:    "HUMAN_LEAD",     // te hívsz
    AI_LEAD:       "AI_LEAD",        // a gép hív
    HUMAN_RESPOND: "HUMAN_RESPOND",  // a gép hívott, te teszel rá
    AI_RESPOND:    "AI_RESPOND",     // te hívtál, a gép tesz rá
    TRICK_DONE:    "TRICK_DONE",     // kör vége, rövid szünet
    GAME_OVER:     "GAME_OVER",
};
