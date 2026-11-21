const calculate_score = (map) => {
  const { width, height, content } = map;

  // Mezők gyors elérése "sor,oszlop" kulcs alapján.
  const grid = new Map(content.map((f) => [`${f.row},${f.column}`, f]));

  // Egy mező 8 szomszédjának (a pályán belüli, foglalt) figurái.
  const neighbors = (row, col) =>
    [-1, 0, 1]
      .flatMap((dr) => [-1, 0, 1].map((dc) => [row + dr, col + dc]))
      .filter(([r, c]) => (r !== row || c !== col) && r >= 0 && r < height && c >= 0 && c < width)
      .map(([r, c]) => grid.get(`${r},${c}`))
      .filter(Boolean);

  // A torony tulajdonosa a szomszédos lovagok összesített ereje alapján (döntetlennél marad az eredeti).
  const getOwner = (tower, near) => {
    const power = { p1: 0, p2: 0 };
    near.filter((f) => f.type === "knight").forEach((k) => (power[k.owner] += k.strength));
    if (power.p1 > power.p2) return "p1";
    if (power.p2 > power.p1) return "p2";
    return tower.owner;
  };

  const score = { p1: 0, p2: 0 };

  content
    .filter((f) => f.type === "tower")
    .forEach((tower) => {
      const near = neighbors(tower.row, tower.column);
      // Ha van magasabb szomszédos torony, ez a torony nem ér pontot.
      if (near.some((f) => f.type === "tower" && f.height > tower.height)) return;
      const owner = getOwner(tower, near);
      // Semleges torony ("") senkinek sem ad pontot.
      if (owner) score[owner] += tower.height;
    });

  return [score.p1, score.p2];
};

module.exports = { calculate_score };