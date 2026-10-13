# Kártyázzunk! – magyarázat a nehezebb részekhez

Indítás: `index.html` dupla kattintással. Nincs szerver, nincs külső könyvtár.

## Fájlok

| Fájl | Mit csinál |
|---|---|
| `adatok.js` | méretek, színek, értékek – csak adat |
| `pakli.js` | pakli elkészítése, keverés, húzás |
| `szabalyok.js` | ki üt kit, mit tehet le a játékos, pontszámítás |
| `gep.js` | a gép döntései |
| `jatek.js` | a játék menete: ki jön, mi történik a kör végén |
| `rajzolas.js` | minden rajzolás a vászonra |
| `esemenyek.js` | egérkattintás, gomb, indítás |

---

## 1. Miért több `<script>` és miért számít a sorrend?

A zsűri a fájlt a saját gépéről nyitja meg (`file://`). Ilyenkor a böngésző **nem engedi** a modern `import` / `export` megoldást (`type="module"`). Ezért sima `<script>` tagekkel töltjük be a fájlokat.

Ilyenkor minden fájl változói és függvényei **közösek** (globálisak). Egy fájl azt használhatja, ami **előtte** töltődött be. Ezért van az `adatok.js` legelöl, és az `esemenyek.js` a végén, mert az indít el mindent.

Ha új fájlt adtok hozzá: tegyétek oda a sorba, ahová kell.

## 2. A „fázis" – honnan tudja a program, ki jön?

A `jatek.js`-ben a `fazis` változó mondja meg, hol tart a kör. Ez a legfontosabb ötlet az egész programban.

```
           ┌─ hivo = jatekos ─▶ "jatekos_hiv" ── kattint ──▶ "gep_ratesz" ──┐
korIndul ──┤                                                                ├─▶ "kor_vege" ─▶ huzas ─▶ korIndul
           └─ hivo = gep ─────▶ "gep_hiv" ─── vár ───▶ "jatekos_ratesz" ────┘
                                                                  (ha elfogyott minden lap: "vege")
```

Miért kell? A kattintás **bármikor** jöhet. A `jatekosKattintott` először megnézi a fázist, és csak akkor csinál valamit, ha éppen a játékos jön. Ha a gép gondolkodik, a kattintás nem csinál semmit. Fázis nélkül a játékos a gép köre közben is lerakhatna lapot.

## 3. `setTimeout` – miért nem rögtön lép a gép?

Ha a gép azonnal lépne, a játékos nem látná, mit tett le. Ezért:

```js
idozito = setTimeout(gepHiv, GEP_GONDOLKODIK);
```

Ez azt jelenti: **900 ms múlva** hívd meg a `gepHiv` függvényt. A program addig nem áll meg, a rajzolás közben is fut.

**Csapda:** ha a játékos megnyomja az „Új játék" gombot, miközben a gép még vár, a régi `setTimeout` lefutna az új játékban, és összekeverne mindent. Ezért eltároljuk az azonosítóját az `idozito` változóban, és az `ujJatek` első sora törli:

```js
clearTimeout(idozito);
```

A `korKiertekel`-ben a `setTimeout`-nak egy **névtelen függvényt** adunk át (`function () { ... }`). Ez azért kell, mert ott két dolgot akarunk egymás után csinálni: húzni, aztán új kört indítani.

## 4. Keverés (Fisher–Yates)

```js
for (var i = pakli.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    // pakli[i] és pakli[j] csere
}
```

Hátulról indulunk. Minden lépésben a még nem véglegesített lapok közül (0..i) véletlenszerűen választunk egyet, és a helyére tesszük. Így minden sorrend ugyanolyan valószínű.

A neten gyakori `pakli.sort(() => Math.random() - 0.5)` **rossz**, mert nem egyenletesen kever. Ha a zsűri ránéz, ez hiba.

## 5. Melyik lapra kattintott?

Két lépés:

1. **Az egér helye a vásznon belül.** Az `event.clientX` az ablakhoz képest adja meg a helyet, ezért kivonjuk belőle a vászon bal felső sarkát. Ez ugyanaz, mint a tananyagban:
   ```js
   var x = event.clientX - vaszonHelye.left;
   ```
2. **Melyik lap téglalapjába esik.** A `lapX(index, darab)` függvény megmondja, hol kezdődik az adott lap. **Ugyanezt a függvényt használja a rajzolás és a kattintás is.** Így ha valaha átírjátok, hol legyenek a lapok, a kattintás magától követi. Ha két külön számítás lenne, előbb-utóbb elcsúsznának egymástól.

## 6. A kötelező ütés (f pont) – hogyan van megoldva?

A `szabalyok.js`-ben:

- `utiE(hivott, raadott)` – üti-e az egyik a másikat
- `utoLapok(kez, hivott)` – a kézből azok, amelyek ütnek
- `rakhatoLapok(kez, hivott)` – ha van ütő lap, csak azok; ha nincs, az egész kéz

Ezt a hármat használja:
- a **játékos**: a `lerakhatoE` megnézi, benne van-e a kattintott lap a `rakhatoLapok` listában
- a **rajzolás**: sárgával kiemeli a letehető lapokat
- a **gép**: csak az `utoLapok` listából választhat, ha tud ütni

Mivel mindhárom ugyanazt a függvényt hívja, a gép sem tud csalni (i pont: „fontos, hogy a szabályokat tartsa be").

Az `.indexOf(lap) !== -1` azt jelenti: benne van-e a lap a listában. Ha nincs benne, `-1`-et ad vissza.

## 7. A gép stratégiája

- **Ha hív:** a legkevesebb pontot érő lapot teszi le, hogy ha elviszik tőle, kevés pontot veszítsen.
- **Ha rátesz és tud ütni:** a **leggyengébb** ütő lapját használja, a jobbakat megtartja.
- **Ha nem tud ütni:** a legkevesebb pontot érő lapot dobja el.

Egyszerű, de nem buta. Ha javítani akartok rajta, a `gep.js` az egyetlen fájl, amit módosítani kell.

## 8. Lapok mint objektumok

Egy lap egy sima objektum:

```js
{ szin: "Piros", rajzSzin: "#c0392b", ertek: "Ász", erosseg: 8, pont: 0 }
```

Az `erosseg` az ütéshez kell (melyik a nagyobb). A `pont` a számoláshoz. Azért külön mező a kettő, mert az Ász a legerősebb, mégis 0 pontot ér.

---

## Feladatpontok – hol vannak a kódban

| Pont | Hol |
|---|---|
| a) ember a gép ellen | az egész `jatek.js` |
| b) véletlen kezdő | `ujJatek()` – `Math.random() < 0.5` |
| c) keverés, 4-4 lap | `kever()`, `ujJatek()` ciklusa |
| d) csak a saját lapját látja | `rajzol()` – a gép lapjai `hatlapotRajzol` |
| e) játékmenet | `korIndul` → hívás → rátevés → `korKiertekel` |
| f) kötelező ütés | `rakhatoLapok()`, `lerakhatoE()` |
| g) húzás kör után | `huzas()` |
| h) pontok folyamatosan | `rajzol()` – `pontokOsszege(...)` |
| i) gépi logika | `gep.js` |
| j) győztes kihirdetése | `jatekVege()` + a sötét réteg a `rajzol()` végén |

## Ötletek, ha sajátot akartok belőle csinálni

- kártyaképek `drawImage`-dzsel (tananyag: smiley példa) – a képeket is tegyétek a zip-be
- lap „felemelése", amikor az egér fölötte van (`mousemove` esemény)
- okosabb gép: figyeli, milyen lapok mentek már ki
