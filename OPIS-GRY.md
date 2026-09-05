# Mirków. Opis gry, budowy i decyzji

**Stan:** 5 września 2026, po etapach E1–E3 (wygląd i balans), G1–G5 (projekt „Głębia”) i krokach 1–4 audytu UX (`docs/audyt-ux-2026-09-05.md`: prowadzenie gracza, przypięty koniec tygodnia, arkusz na telefonie, postacie Mirkowa z kwestiami, karta Kowalskiego z miną).
**Repozytorium:** https://github.com/PrzemoPle/mirkow (prywatne, gałąź `main`).
**Roboczy tytuł:** Mirków (podtytuł „Symulator życia”). Nazwa docelowa i domena nie są jeszcze ustalone.

Ten dokument jest wejściem dla osoby albo agenta, który dostaje paczkę bez historii rozmów. Pozostałe dokumenty w `docs/` są źródłami decyzji; gdy coś się rozjeżdża, **kod i ten plik wygrywają**.

---

## 1. O co chodzi w grze

Turowa satyra życia w fikcyjnym polskim mieście **Mirków** (poznański koloryt: tramwaj, obwodnica, uczelniane skróty, bez realnych dzielnic). Inspiracja: *Jones in the Fast Lane* (Sierra, 1991) i *No Time to Relax*.

Gracz zaczyna bez pracy, bez dyplomów, w wynajętym pokoju u Krysi z 800 zł. Co tydzień ma **12 cz.** (jednostek czasu) na drogę po mieście, pracę, naukę, zakupy i odpoczynek. Rywal, bot **Kowalski**, gra tymi samymi zasadami. Wygrywa ten, kto pierwszy zbierze **wszystkie cztery progi naraz**: pieniądze, szczęście, wykształcenie, kariera. Progi ustawia się na starcie (presety Krótka / Normalna / Długa albo ręcznie).

Satyra jest średnia: PUP, PIT, MOPS, teściowa, kontrola w tramwaju, Zdzichu z klatki. Marki tylko jako analogi (Żuczek, Nocna Buła, Aukcje.pl, Kupon Szczęścia, Elektro-Mir, MZT). Zakaz realnych logotypów, partii i twarzy.

Gra jest przeglądarkowa (desktop i telefon), instalowalna jako PWA, bez konta i bez backendu. Zapis partii w `localStorage`.

---

## 2. Miasto i plansza

Plansza 4×3 na desktopie (3×4 na telefonie). Jedenaście lokacji plus Skwer jako dekoracja w środku.

```
[PUP Mirków]  [WSMiK]     [Nasza Kasa]  [Zajezdnia]
[Na Rogu]     [Skwer]     [Elektro-Mir] [Siłka Rzeźba]
[Dom]         [Żuczek]    [Lombard]     [Nocna Buła]
```

| Lokacja | ID | Co się tam robi |
|---|---|---|
| PUP Mirków | `pup` | tablica ofert (podania o pracę), podwyżka; praca referenta i naczelnika |
| WSMiK | `campus` | indeks: zapis na dyplom, zajęcia, egzamin |
| Nasza Kasa | `bank` | konto, lokata, kredyt, akcje MZT; praca kasjera, doradcy, dyrektora |
| Zajezdnia | `zajezdnia` | praca montera, brygadzisty, inżyniera, dyrektora zajezdni |
| Na Rogu | `cafe` | kawka (+5 szczęścia) |
| Elektro-Mir | `elektro` | nowe sprzęty, naprawa |
| Siłka Rzeźba | `gym` | trening (+8 szczęścia) |
| Dom | `home` | drzemka, widok pokoju z rzeczami, umowy mieszkań, przeprowadzka |
| Żuczek | `shop` | jedzenie, ubranie; praca układacza półek, kasjera, kierownika sklepu |
| Lombard | `lombard` | używane sprzęty, skup, garnitur |
| Nocna Buła | `kebab` | zjedz na miejscu, własny lokal; praca pomocy kuchennej, kasjera, kierownika zmiany |

Ruch po torach: graf krawędzi w `src/game/board.ts`, koszt 1–2 cz. na krawędź, Dijkstra. Rower skraca trasy dłuższe niż 1 cz. o 1. Pionek jedzie animacją po kolejnych węzłach trasy.

---

## 3. Systemy gry (liczby są w kodzie, tu skrót)

### 3.1 Tydzień i potrzeby

- Tura = tydzień, 12 cz. Koniec tygodnia rozlicza: czynsz (co 4 tyg.), ratę kredytu, lokatę, event, siatkę bezpieczeństwa, zużycie zapasów, solidność, zwolnienia, kradzieże i awarie, szczęście, weekend, kary za głód i brak ubrania, korek.
- Jedzenie z Żuczka na 3 tyg. (z lodówką 6), ubranie na 4 tyg. (z pralką 6), garnitur z Lombardu na 8 tyg. Głód: −2 cz. i −3 szczęścia. Brak ubrania: −5 szczęścia.
- Szczęście spada o 1 co tydzień; podtrzymują je odpoczynek, sprzęt, mieszkanie i weekendy.
- Siatka bezpieczeństwa: przy kasie ≤ 0 wpływ od cioci (500) albo zasiłek z MOPS (350). Nie ma trwałej przegranej.

### 3.2 Praca: 5 firm, 16 stanowisk

`src/game/jobs.ts`. Każde stanowisko ma wymagania: **staż** (liczba zmian), **solidność** (0–100), **dyplomy**, czasem **garnitur**. Zmiana to 3 cz.; płaca 220 zł (pomoc kuchenna) do 950 zł (dyrektor zajezdni), mnożona przez podwyżki i koniunkturę.

- Solidność: +4 za zmianę, **−3 co tydzień**. Dziesięć punktów poniżej wymagania stanowiska = zwolnienie (karta, kariera od zera). Tydzień bez pracy to realne ryzyko, jak w Jonesie.
- Kariera = prestiż aktualnego stanowiska (5–100). Bez pracy kariera to 0, więc próg trzeba trzymać w chwili wygranej.
- Podwyżka w PUP: po 8 tyg. na stanowisku (razy numer podwyżki), z zapasem solidności, +10%, maksymalnie dwie.
- Własny lokal: dla kierownika zmiany Nocnej Buły, buy-in 1800 zł, prestiż 70.
- Koniunktura (`economy.ts`): co 8 tygodni boom / normalnie / recesja. Boom: płace +15%, ceny +10%. Recesja: płace −15%, jedna firma nie zatrudnia, redukcje z 10% szansą dla osób tuż nad progiem solidności, stawki nowych umów mieszkaniowych −20%.

### 3.3 Nauka: 7 dyplomów i egzaminy

`src/game/diplomas.ts`. Kurs zawodowy (4 zajęcia, 10 pkt), matura wieczorowa (6, 15), zarządzanie, ekonomia, administracja (8, 20, po maturze), inżynieria (10, 25, po maturze), magister (10, 30, po dowolnym licencjacie). Wykształcenie to suma punktów dyplomów.

- Zapis w indeksie darmowy. Zajęcia 3 cz. (magister 4) i 100–400 zł. Postęp zostaje po zmianie kierunku.
- Egzamin 2 cz., 80 zł. **Szansa = 40% + 10% za każde zajęcia z ostatnich 4 tygodni** (max 100%). Komputer +10%, encyklopedia +10%. Oblany: opłata przepada, −3 szczęścia, powtórka za tydzień.
- Stanowiska wymagają konkretnych dyplomów, a tablica w PUP mówi, którego brakuje.

### 3.4 Dom i przedmioty

`src/game/homes.ts`, `src/game/items.ts`.

| Mieszkanie | Czynsz bazowy | Miejsca | Kradzieże | Szczęście / tydz. |
|---|---|---|---|---|
| Pokój u Krysi | 400 | 3 | tak | 0 |
| Kawalerka w bloku | 700 | 6 | nie | +1 |
| Mieszkanie nad Skwerem | 1200 | 10 | nie | +3 |

- Umowa **zamraża czynsz** na stawce z dnia podpisania (bazowa × koniunktura). Przeprowadzka 2 cz. plus kaucja (jeden czynsz) przy wprowadzce wyżej. W recesji opłaca się przepisać umowę.
- Kradzież na stancji: 8% tygodniowo (12% przy ≥3 rzeczach), znika jeden przedmiot, karta „Zdzichu z klatki”.
- Przedmioty: lodówka 900 (jedzenie na 6 tyg.), pralka 800, kanapa 400 (drzemka +5), telewizor 700 (+1/tydz.), wieża 600 (+1/tydz.), komputer 1800 (zajęcia −1 cz., egzamin +10%), encyklopedia 300, rower 500. Kupione w Elektro-Mir psują się z 1% szansą tygodniowo, używane z Lombardu (60% ceny) z 3%. Naprawa 20% ceny, skup 50%.
- Pokój jest widoczny: wnętrze mieszkania z rzeczami na półkach, zepsute z ikoną klucza.

### 3.5 Pieniądze

`src/game/bank.ts`. Próg „pieniądze” liczy **majątek**: gotówka + konto + lokata + akcje po kursie − kredyt.

- Konto: wpłaty i wypłaty po 100 zł, bezpieczne od kieszonkowca.
- Lokata: 1000 zł, 1080 zł po 4 tygodniach, jedna naraz.
- Kredyt: do sześciu płac za zmianę, kroki po 500, 4% za 4 tygodnie, rata 25% kapitału plus odsetki co 4 tygodnie, z gotówki, potem z konta. Dwie zaległe raty = komornik (przedmiot albo 20% gotówki).
- Akcje MZT (Mirkowskie Zakłady Tramwajowe): pakiety po 10, kurs startowy 50 zł, dryf tygodniowy boom +5..15%, recesja −5..15%, normalnie ±8%. Wykres 12 tygodni w panelu banku.

### 3.6 Zdarzenia i weekendy

- **Eventy** (`events.ts`): co koniec tury jedna z 11 kart, losowanie ważone (spokojny tydzień 2,5, napiwki 1,5, reszta 1): korek, Kupon Szczęścia, pralka padła, teściowa, Aukcje.pl, kontrola w tramwaju, PIT, promocja w Żuczku, napiwki, spokojny tydzień, kieszonkowiec (−10% gotówki, max 300).
- **Weekendy** (`weekends.ts`): co tydzień jedna z 22 linijek zależna od tego, co masz (telewizor, komputer, rower, kanapa, mieszkanie), od −80 do +120 zł i od −2 do +3 szczęścia. Bez kart, tylko wpis w dzienniku.
- **Karty z pracy i życia** (`NoticeId`): zwolnienie, redukcja, podwyżka, awans, oblany egzamin, dyplom, Zdzichu, przeprowadzka, komornik.

### 3.7 Kowalski

`src/game/bot.ts`. Heurystyka priorytetów: potrzeby → praca do progu solidności → własny lokal → garnitur (gdy blokuje podanie) → lepsze stanowisko → podwyżka → pilna kasa → dyplom pod cel kariery → praca na kasę i staż → sprzęt, mieszkania, bank → szczęście. Każdy ruch jest sprawdzany „na sucho” (czy akcja po dojeździe będzie legalna). Tura bota jest odtwarzana w UI krok po kroku, z przyciskiem „Pomiń”.

### 3.8 Balans

`src/game/balance.test.ts` symuluje partię bot kontra bot. Stan po G5: krótka ok. 35–46 tygodni, normalna 63–75, długa 66–84. Człowiek gra szybciej. Test pilnuje widełek 30–180 dla normalnej partii.

---

## 4. Jak gra jest zbudowana

### 4.1 Stack

| Warstwa | Wybór | Dlaczego |
|---|---|---|
| Język | TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` | błędy stanu łapane w kompilacji |
| Bundler | Vite 8, `base: './'` | GitHub Pages, brak konfiguracji |
| UI | vanilla DOM, bez frameworka | plansza 3×4 nie potrzebuje Reacta ani silnika gier; mniej zależności |
| Testy | Vitest, środowisko `node`, 124 testy w `src/**/*.test.ts` | silnik testowany bez przeglądarki |
| Fonty | Outfit (body, cyfry) i Bricolage Grotesque (tytuły), self-host z Fontsource | brak zależności od Google Fonts w runtime |
| Grafika | PNG w `public/art/`, HD pixel / dither, ciemne, wieczorne | patrz §6 |
| PWA | `public/manifest.webmanifest`, `public/sw.js` z ręcznym precache (`CACHE_NAME` = `mirkow-v5`) | instalacja na telefonie, offline |

### 4.2 Silnik nie zna DOM

Świadomy podział. `src/game/` to czysty silnik: stan gry jest jednym obiektem JSON (`GameState`, `version: 5`), jedyna mutacja idzie przez `dispatch(state, action)`, który zwraca **nowy obiekt** albo błąd. Bez wyjątków w `dispatch`, bez losowości spoza `rngSeed`.

```
index.html
  → src/main.ts              style, fonty, SW w PROD, renderApp
    → src/ui/app.ts          pętla UI: ruch, akcja, koniec tygodnia, replay bota, karty
         ↓ dispatch / loadSave / playBotWithTrace
    src/game/reducer.ts      jedyne miejsce zmian stanu
    src/game/*.ts            katalog, akcje, praca, dyplomy, domy, przedmioty, bank, eventy, weekendy, bot, zapis
    src/i18n/pl.ts           cały tekst widoczny dla gracza
    src/ui/art.ts            kontrakt nazw plików bitmap
```

**Akcje silnika** (`GameAction`): `start`, `move`, `act` (11 akcji: praca, lokal, zajęcia, egzamin, jedzenie, ciuchy, garnitur, drzemka, kawka, trening, lokata, zjedz na miejscu), `apply` (podanie), `askRaise`, `enroll`, `relocate`, `buyItem`, `sellItem`, `repairItem`, `account`, `loan`, `trade`, `endWeek`.

**Wynik**: `{ ok: true, state }` albo `{ ok: false, error }` z ok. 30 kodami błędów (`src/game/result.ts`). UI używa tych samych kodów jako **powodów blokady** w listach (tablica ofert, indeks, sklepy, bank), robiąc „próbę na sucho” przez `dispatch`. To jest kluczowa decyzja: gracz zawsze widzi, czego mu brakuje, zamiast trafiać na błąd po kliknięciu.

**Kolejność końca tygodnia** (`endWeek` w reducerze): czynsz → rata kredytu → lokata → event → siatka bezpieczeństwa → sprawdzenie zwycięstwa → zużycie zapasów i solidności → kradzieże i awarie → szczęście z domu i sprzętu → weekend → zwolnienia → jedzenie z eventu → kary → korek → zmiana gracza; po pełnym okrążeniu: koniunktura (co 8 tyg.), ceny w Żuczku, kurs akcji, nowy tydzień.

**RNG** deterministyczny (`rng.ts`), seed w stanie. W testach `firstSeedFor(eventId)` wymusza konkretny event.

**Zapis**: `localStorage`, klucz `mirkow.save.v5`. Parser (`save.ts`) jest świadomie ścisły i odrzuca śmieci; stare klucze v1–v4 dają status `outdated` i komunikat na ekranie startu. Każda zmiana `GameState` podbija wersję zapisu; migracji nie ma.

### 4.3 Warstwa UI

Vanilla DOM z małym `el()`/`svgEl()`. Każdy moduł buduje swój fragment DOM raz i ma `sync(state, …)` do aktualizacji.

| Plik | Rola |
|---|---|
| `ui/app.ts` | stan aplikacji, handlery, replay tury bota, karty eventów i powiadomień, zapis |
| `ui/board.ts` | plansza, tory SVG, pionki z animacją po trasie, kafelek domu zależny od mieszkania |
| `ui/panel.ts` | panel miejsca: kadr lokacji (albo pokój), akcje z powodem blokady, tablice pod-paneli, koniec tygodnia z potwierdzeniem |
| `ui/jobs-board.ts` | tablica ofert w PUP i podwyżka |
| `ui/campus.ts` | indeks w WSMiK: postęp, szansa zdania, co dyplom otwiera |
| `ui/home.ts` | pokój z przedmiotami (sprite'y w strefach A/B/C) i umowy mieszkań |
| `ui/shops.ts` | Elektro-Mir (nowe, naprawa), Lombard (używane, skup) |
| `ui/bank.ts` | konto, kredyt, akcje z wykresem |
| `ui/hud.ts` | pasek górny (bilety czasu, koniunktura, gotówka i majątek), staty segmentowe, potrzeby jako pieczątki, dyplomy |
| `ui/work.ts` | karta pracy: stanowisko, płaca, pasek solidności z minimum, staż, ostrzeżenie przed zwolnieniem |
| `ui/journal.ts` | dziennik tygodnia (stan UI, nie zapis) |
| `ui/overlays.ts` | karta eventu / powiadomienia w pełnym kadrze, ekran zwycięstwa |
| `ui/setup.ts` | ekran startu: panorama, presety, portrety, imię |
| `ui/copy.ts`, `ui/errors.ts` | mapowanie ID silnika na copy PL |
| `styles/*.css` | tokeny (jeden ciemny motyw), base, game, overlays, setup |

### 4.4 Kierunek wizualny: „Wieczór w Mirkowie”

Jeden ciemny motyw, zablokowany (bez `prefers-color-scheme`). Ciemny blat, kafelki jako oświetlone okna, tekst na papierowych tabliczkach, koszt drogi jako bilet tramwajowy, czas jako 10–12 biletów, potrzeby jako pieczątki. Jedna skala promieni (4 px), zero pigułek, zero gradientów tła, separator „·” tylko w metadanych. Plansza jest bohaterem ekranu: desktop = plansza plus panel z boku, telefon = plansza na całą szerokość plus dolna karta akcji. Powód: bitmapy są ciemne i wieczorne, wcześniejszy jasny formularz je zabijał (`docs/przeglad-2026-09-05.md`).

---

## 5. Uruchomienie i praca z kodem

Wymagania: Node.js 20+.

```bash
npm install
npm test          # 124 testy Vitest
npm run dev       # Vite, http://127.0.0.1:5173
npm run build     # tsc --noEmit + vite build → dist/
npm run preview   # podgląd builda z SW i PWA
```

Reguły dla kodu (także dla agentów, `CLAUDE.md`):

- silnik nie importuje DOM; mutacja tylko przez `dispatch`;
- `switch` po uniach zawsze z `default` i `assertNever`;
- nowe ID (akcja, event, stanowisko, przedmiot): `types.ts` → definicja → `pl.ts` → `copy.ts` → UI → test → ewentualnie PNG i `public/sw.js` (podbić `CACHE_NAME`);
- copy po polsku w `pl.ts`, **bez pauzy em dash** (test pilnuje);
- zero tekstu i logotypów na bitmapach, nazwy plików to kontrakt z `ui/art.ts`;
- każdy nowy system dostaje test w `src/game/*.test.ts`, a balans sprawdza `balance.test.ts`.

---

## 6. Grafika

Wszystkie bitmapy w `public/art/`, komplet z paczek P0–P3 (ok. 130 plików, ok. 12 MB PNG). Styl lock: HD pixel / dither, wieczór, papier `#E8DCC8`, tusz `#2B2622`, akcent `#D4652F`. Briefy z wymiarami i zakazami: `docs/brief-bitmapy.md` (P0), `docs/brief-p1.md`, `docs/brief-p2.md`, `docs/brief-p3.md`.

| Zestaw | Pliki |
|---|---|
| kafelki 512×384 | 11 lokacji + skwer + 2 warianty domu |
| portrety 512×512, pionki 256×256 | Ola, Bartek, Nati, Marek, Kowalski |
| karty 768×1024 | 11 eventów + 10 powiadomień |
| wnętrza 1024×576 | stancja, kawalerka, apartament |
| przedmioty 256×256 | 8 sprzętów + garnitur |
| dyplomy 128×128 | 7 |
| ikony 64×64 | akcje (ok. 25), HUD (13) |
| brand | pieczątka, laur, panorama 1920×1080, mata planszy, ikony PWA |

Kod ma fallback na brakujące pliki (szary kafelek, ikona zastępcza), więc nowe zestawy można wpinać etapami.

---

## 7. Co jest zrobione i czego nie ma

**Zrobione (2026-09-05):** E1 fundament wizualny, E2 moment gry (karty, replay bota, gating, dziennik, zwycięstwo), E3 balans, P2 i P3 grafiki wpięte, G1 praca, G2 nauka, G3 dom i przedmioty, G4 pieniądze i weekendy, G5 Kowalski.

**Świadomie odłożone:**

| Temat | Stan |
|---|---|
| Publikacja (E4) | brak CI, brak deployu; plan: GitHub Actions, GitHub Pages pod `przemople.github.io/mirkow`, PNG → WebP, `vite-plugin-pwa` zamiast ręcznego `sw.js`, jeden smoke test Playwright |
| Nazwa i domena | otwarte; „Mirków” to też realne wsie w Polsce, `mirkow.pl` prawdopodobnie zajęte |
| Hot-seat 2–4 graczy | silnik ma `players[]`, UI zakłada 1 człowiek + 1 bot |
| Online, konta, ranking | poza zakresem |
| EN | `t(key)` bez drugiego słownika |
| Dźwięk, walk cycle, pory dnia | nie, zgodnie z briefami |
| Pozycje sprite'ów w pokoju | wspólne dla trzech wnętrz; w stancji kanapa staje częściowo na łóżku; wystarczy tabela per mieszkanie |
| Kowalski a lokata i siłownia | nie korzysta |
| Playtest do zwycięstwa przez człowieka | do zrobienia po E4 |

---

## 8. Indeks dokumentów

| Plik | Czytać jako |
|---|---|
| `OPIS-GRY.md` | ten plik: całość, stan i decyzje |
| `CZYTAJ-TO.md` | starszy handoff z tabelą liczb (aktualizowany etapami) |
| `CLAUDE.md` | reguły kodu dla agenta AI |
| `docs/przeglad-2026-09-05.md` | diagnoza „dlaczego wyglądało jak formularz” i plan E1–E4 |
| `docs/projekt-glebia.md` | model rozgrywki na wzór Jonesa, etapy G1–G5, źródła |
| `docs/brief-p4.md` | brief P4 po audycie: postacie Mirkowa, miny Kowalskiego, ikona lokaty, winiety weekendów |
| `docs/audyt-ux-2026-09-05.md` | audyt UX/UI po G5 z kolejnością napraw i briefem P4 (postacie Mirkowa) |
| `docs/zalozenia.md`, `docs/decyzje.md` | pierwotna intencja i cięcia MVP (część historyczna) |
| `docs/grafika.md`, `docs/brief-*.md` | paleta, wymiary i zakazy dla bitmap |
| `docs/warianty-grafiki/` | archiwum prób stylu, nie wchodzi do builda |
