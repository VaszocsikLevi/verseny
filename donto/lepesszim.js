// Lépésszimuláció: végrehajtja a lépéseket, és visszaadja a végső pályát.
const simulate_game = (input) => {
  const { map, steps } = input;
  const { width, height } = map;

  // A pálya másolata: mezők "sor,oszlop" kulcs alapján (az eredeti nem módosul).
  const grid = new Map(map.content.map((f) => [`${f.row},${f.column}`, { ...f }]));
  const pool = input.pool.map((p) => ({ ...p }));

  const key = (r, c) => `${r},${c}`;

  // Pályán belül van-e a mező.
  const inside = (r, c) => r >= 0 && r < height && c >= 0 && c < width;

  // Üres-e a mező (pályán belül és nincs rajta figura).
  const isEmpty = (r, c) => inside(r, c) && !grid.has(key(r, c));

  // Egy mező és 8 szomszédjának koordinátái (pályán belül).
  const area = (r, c) =>
    [-1, 0, 1]
      .flatMap((dr) => [-1, 0, 1].map((dc) => [r + dr, c + dc]))
      .filter(([rr, cc]) => inside(rr, cc));

  // Sziklát tesz a mezőre (felülírva, ami ott volt).
  const setRock = (r, c) => grid.set(key(r, c), { row: r, column: c, type: "rock" });

  // Egy választás alkalmazása; érvénytelen célnál nem változtat a pályán.
  const apply = (choice, r, c, player) => {
    if (!inside(r, c)) return;
    const cell = grid.get(key(r, c));

    if (choice.type === "tower" && isEmpty(r, c)) {
      grid.set(key(r, c), { row: r, column: c, type: "tower", height: choice.height, owner: player });
    } else if (choice.type === "knight" && isEmpty(r, c)) {
      grid.set(key(r, c), { row: r, column: c, type: "knight", strength: choice.strength, owner: player });
    } else if (choice.type === "landslide") {
      // Csak az üres mezők lesznek sziklák.
      area(r, c).filter(([rr, cc]) => isEmpty(rr, cc)).forEach(([rr, cc]) => setRock(rr, cc));
    } else if (choice.type === "meteorite") {
      setRock(r, c);
    } else if (choice.type === "conversion") {
      // Csak nem saját torony vagy lovag téríthető.
      if (cell && cell.type !== "rock" && cell.owner !== player) cell.owner = player;
    }
  };

  // Lépések sorban; p1 kezd, a játékosok váltják egymást.
  for (let i = 0; i < steps.length && pool.length > 0; i++) {
    const player = i % 2 === 0 ? "p1" : "p2";
    const { choiceIndex, row, column } = steps[i];

    // Nem létező index: az első elem törlődik, a pálya változatlan.
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= pool.length) {
      pool.shift();
      continue;
    }

    // A választott elem kikerül a készletből, majd alkalmazzuk.
    const [choice] = pool.splice(choiceIndex, 1);
    apply(choice, row, column, player);
  }

  return { width, height, content: [...grid.values()] };
};

if (typeof module !== "undefined") module.exports = { simulate_game };