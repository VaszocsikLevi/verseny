// Vonalikonok (lucide-stílus: 24-es rács, 1,5-ös vonal, a szöveg színét veszik fel).

const IKON_UTVONAL = {
  tower: '<path d="M5 21V9h2.5V5.5h2V9h1.5V5.5h2V9h1.5V5.5h2V9H19v12z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
  knight: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  landslide: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  meteorite: '<circle cx="15" cy="15" r="5"/><path d="M3 3l7.5 7.5"/><path d="M8 3l4.5 4.5"/><path d="M3 8l4.5 4.5"/>',
  conversion: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  first: '<path d="M18 19 11 12l7-7"/><path d="M6 5v14"/>',
  prev: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  last: '<path d="m6 5 7 7-7 7"/><path d="M18 5v14"/>',
  play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

const ikon = (nev, meret = 16) =>
  `<svg class="ikon-svg" width="${meret}" height="${meret}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON_UTVONAL[nev] || ""}</svg>`;

// Az HTML-ben a data-ikon attribútumú elemek elejére beteszi az ikont.
const ikonokBeillesztese = () => {
  document.querySelectorAll("[data-ikon]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", ikon(el.dataset.ikon, Number(el.dataset.ikonMeret) || 16));
  });
};
