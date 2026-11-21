# Feladatbontás – 7 lépés

> **Értsd meg, oldd meg kézzel, bontsd kicsire, tesztelj darabonként, előbb működjön, aztán legyen jó.**

## 1. Megérteni (kódot még nem írok)

- Mi a **cél**? Írd le egy mondatban, a saját szavaiddal.
- Mi a **bemenet**, és mi a **kimenet**?
- Mik a **szabályok és korlátok**? Húzd alá őket a feladatban.
- Mi számít **jó megoldásnak**? Mi alapján pontoznak?

## 2. Kézzel megoldani egy kis példát

- Oldd meg papíron egy egyszerű esetre.
- Közben írd le, **mit csinálsz lépésről lépésre**. Ezekből a lépésekből lesznek a függvények.

## 3. Az állapot összeszedése

- Mit kell **megjegyeznie** a programnak, hogy tudja, hol tart?
- Sorold fel a változókat: név, típus, mit tárol.
- Próba: ha ezt a pár értéket leírod egy papírra, bárki onnan tudja folytatni? Ha igen, megvan az állapot.

## 4. Darabokra bontás

- Bontsd a feladatot **kis részekre**. Minden rész egy függvény legyen, ami egy dolgot csinál.
- Rétegekben gondolkodj, alulról fölfelé:
  1. **Számoló** függvények: csak kiszámolnak valamit, semmit nem változtatnak meg.
  2. **Döntő** függvények: a számolók alapján választanak.
  3. **Cselekvő** függvények: itt változik meg az állapot.
  4. **Vezérlés**: ez hívja a többit, ciklusban vagy egymás után.
- Rajzold le, **melyik függvény melyiket hívja**.

## 5. Minden függvény előtt 4 kérdés

1. **Mit kap?** (paraméterek)
2. **Mit ad vissza?** (típus, és mit ad, ha nincs eredmény, például `null`)
3. **Megváltoztat valamit?** Ha csak számol, akkor ne nyúljon az eredeti adatokhoz. Kell-e másolat?
4. **Hogyan tesztelem?** Írd le előre a várt eredményt, és csak utána futtasd le.

**Egy függvény → egy teszt → csak utána jöhet a következő.**

## 6. Előbb legyen működő verzió, csak utána javíts

- Először a **legegyszerűbb** megoldás készüljön el, ami az elejétől a végéig lefut, akkor is, ha buta.
- Ha működik, **mentsd el** (commit vagy másolat).
- Javítani csak ezután szabad, egyszerre **egy dolgot**, és minden javítás után újra tesztelj.
- A javításokat **haszon / munka** szerint rakd sorba: előbb jön, ami sokat hoz és kevés munka.

## 7. Ha elakadok

- **15 perc után sincs előrelépés?** Egyszerűsíts, vagy ugord át, és térj vissza később.
- **Rossz az eredmény?** Írasd ki az állapotot minden lépés után (`console.log`), és keresd meg, **hol tér el** attól, amit vártál.
- **`undefined` vagy hiba jön?** Nézd meg, hogy minden ágon van-e `return`, és hogy jó típust kap-e a függvény.
- **Elrontottam?** Állj vissza az utolsó működő mentésre.
