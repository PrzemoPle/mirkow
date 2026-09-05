# Paczka handoff: Symulator życia (Mirków)

**Data stanu:** 5 września 2026 (po południu: wdrożone etapy E1 i E2 z `docs/przeglad-2026-09-05.md`; sekcje 4–6 poniżej opisują silnik i grafikę, mapa UI jest w `CLAUDE.md`)  
**Dla kogo:** kolejna osoba (albo agent), która ma kontynuować rozwój bez historii czatu.  
**Status:** MVP jest grywalne lokalnie. Grafika P0 i P1 jest wpięta. Nie ma publikacji, nazwy marketingowej ani domeny.

Ten plik jest wejściem do paczki. Reszta dokumentów w `docs/` to źródła decyzji i briefy produkcyjne. Gdy coś się rozjeżdża, **kod i ten plik wygrywają** nad starymi briefami.

---

## 1. Co to jest

Turowa satyra życia w fikcyjnym polskim mieście **Mirków** (poznański koloryt: tramwaj, obwodnica, skróty uczelniane; bez realnych dzielnic). Inspiracja: Jones in the Fast Lane / No Time to Relax.

Gracz ustawia cztery progi (pieniądze, szczęście, wykształcenie, kariera), chodzi po planszy 3×3, wydaje pulę czasu (`TIME_MAX = 10`) i konkuruje z botem **Kowalski**. Wygrywa ten, kto pierwszy zbierze wszystkie cztery progi naraz.

Roboczy tytuł: **Symulator życia**. PWA `short_name`: **Mirków**. Ostateczna nazwa i domena są otwarte.

---

## 2. Co jest w paczce

Źródła gry (Vite + TypeScript + vanilla DOM), bitmapy w `public/art/`, testy Vitest, dokumentacja.

**W zipie nie ma:** `node_modules/`, `dist/`, `.git/`. Po rozpakowaniu: `npm install`.

| Ścieżka | Po co |
|---|---|
| `CZYTAJ-TO.md` | ten plik: stan, budowa, luki |
| `CLAUDE.md` | instrukcje dla agenta AI w repo |
| `README.md` | szybki start |
| `package.json` | skrypty `dev` / `test` / `build` |
| `src/game/` | silnik: stan, ruchy, tura, bot, zapis |
| `src/ui/` | DOM: setup, plansza, HUD |
| `src/i18n/pl.ts` | cały tekst widoczny dla gracza |
| `public/art/` | bitmapy P0+P1 (gotowe, nazwy plików to kontrakt) |
| `docs/zalozenia.md` | pierwotny brief produktowy (intencja, nie status) |
| `docs/decyzje.md` | zamknięte decyzje z 2026-09-03 |
| `docs/grafika.md` | paleta i kolejność bitmap |
| `docs/brief-bitmapy.md` | spec P0/P1 dla programu graficznego |
| `docs/brief-p1.md` | spec reszty P1 (dostarczone) |
| `docs/warianty-grafiki/` | archiwum prób stylu (nie używane w buildzie) |
| `docs/przeglad-2026-09-05.md` | **przegląd wyglądu i plan zmian E1–E4** (czytać po tym pliku) |
| `docs/brief-p2.md` | grafiki do zamówienia po E1–E2 (panorama, Kowalski, ikony akcji) |
| `docs/uwagi-p4b.md` | uwagi do poprawionej paczki P4b: odrzucony trener, usunięta obwódka, drobiazgi |
| `docs/uwagi-p4.md` | uwagi do dostarczonej paczki P4: co poprawić w postaciach i minach Kowalskiego |
| `docs/brief-p4.md` | brief P4: postacie Mirkowa (11 popiersi), miny Kowalskiego, ikona lokaty, winiety weekendów |
| `docs/audyt-ux-2026-09-05.md` | audyt UX/UI po G5: błędy, prowadzenie gracza, układ, postacie Mirkowa (brief P4) |
| `docs/projekt-glebia.md` | **projekt „Głębia”**: praca z solidnością, dyplomy z egzaminami, mieszkania, przedmioty, bank, weekendy; etapy G1–G5 |

---

## 3. Jak uruchomić

Wymagania: Node.js 20+ (wystarczy aktualne LTS).

```bash
npm install
npm test
npm run dev
```

- Testy: 13 plików, 84 testy, Vitest, środowisko `node` (silnik bez przeglądarki).
- Dev: Vite, zwykle `http://127.0.0.1:5173/`.
- Build na GitHub Pages: `npm run build` → katalog `dist/`, `base: './'` w `vite.config.ts`.
- PWA (`public/sw.js`) rejestruje się **tylko w produkcji**, nie na `npm run dev`.

Nie ma CI, remote Git, commita ani deployu. Repo może być puste albo bez historii. Zapis partii: `localStorage` klucz `mirkow.save.v1`.

---

## 4. Jak gra jest zbudowana

Świadomy podział: **silnik nie zna DOM**. UI tylko woła `dispatch` i rysuje `GameState`.

```
index.html
  → src/main.ts          montuje #app, rejestruje SW w PROD
    → src/ui/render-app.ts   pętla UI, setup albo plansza
         ↓  dispatch / loadSave / playBotUntilIdle
    src/game/reducer.ts  jedyne miejsce mutacji stanu (zwraca nowy obiekt)
    src/game/*.ts        katalog, akcje, praca, eventy, rynek, bot, zapis
    src/i18n/pl.ts       copy
    src/ui/art.ts        URL-e bitmap (kontrakt nazw plików)
    public/art/**        PNG
```

**Stack (jak w decyzji, z korektą po bitmapach):**

| Warstwa | Wybór |
|---|---|
| Język | TypeScript, `strict`, `noUncheckedIndexedAccess` |
| Bundler | Vite 8, `base: './'` |
| UI | vanilla DOM, bez React/Vue |
| Testy | Vitest, pliki `src/**/*.test.ts` obok kodu |
| Font | Outfit, `@fontsource/outfit` (self-host) |
| Paleta | `src/theme/palette.ts` (`paper` `#E8DCC8`, `ink` `#2B2622`, akcent kebab `#D4652F`) |
| Grafika w grze | PNG z `public/art/`. Szyny na planszy to nadal SVG overlay. |

**Wzorce, których trzeba się trzymać:**

- Stan gry to jeden JSON (`GameState`, `version: 1`).
- Akcje silnika: `start` | `move` | `act` | `endWeek`.
- Wynik: `{ ok: true, state }` albo `{ ok: false, error }` (`src/game/result.ts`). Bez wyjątków w `dispatch`.
- Unie i enumy: `switch` z `default` i `never` (`assertNever`).
- Importy na górze pliku.
- Copy po polsku w `pl.ts`. Na bitmapach **zero tekstu i logotypów**. W copy PL nie używać pauzy em dash.
- Marki tylko analogi: Żuczek, Nocna Buła, Aukcje.pl, Kupon Szczęścia. Zakaz: Lotto, Allegro, Biedronka, MPK, godło RP, partie, realne twarze.

### Przepływ tury

1. Setup: imię, awatar (Ola / Bartek / Nati / Marek, tylko wygląd), cztery progi.
2. `start` tworzy człowieka (`p1`, start w `home`) i bota Kowalskiego (`p2`).
3. Ruch: Dijkstra po krawędziach z `src/game/board.ts`, koszt czasu.
4. Akcja: tylko na swojej lokacji, z katalogu `ACTION_DEFS`.
5. `endWeek` (kolejność w reducerze): czynsz co 4 tygodnie → event → siatka bezpieczeństwa (gdy kasa ≤ 0) → sprawdzenie zwycięstwa → spadek jedzenia/ubrań i staż pracy → ewentualne jedzenie z eventu → kary za głód/brak ubrania → korek odejmuje czas na następną turę → zmiana gracza. Po pełnym okrążeniu (z powrotem na indeks 0): nowy tydzień i losowanie cen Żuczka.
6. UI po turze człowieka, jeśli aktywny jest bot, woła `playBotUntilIdle` (heurystyka, limit 32 kroków).

Zwycięstwo: faza `victory`, tekst `{name} zbiera cztery progi.` Brak osobnego ekranu graficznego.

### Plansza

Osiem lokacji + skwer wizualny na środku (skwer **nie jest** `LocationId`, nie da się na niego wejść).

```
[PUP Mirków]  [WSMiK]         [Nasza Kasa]
[Na Rogu]     [Skwer]         [Siłka Rzeźba]
[Pokój u Krysi] [Żuczek]      [Nocna Buła]
```

| ID | Miejsce | Akcje |
|---|---|---|
| `pup` | PUP Mirków | szukaj pracy, awans na kierownika |
| `campus` | WSMiK | kurs weekendowy, zaliczenie |
| `bank` | Nasza Kasa | **brak akcji** (kafelek i koszt drogi są) |
| `cafe` | Na Rogu | kawka |
| `gym` | Siłka Rzeźba | trening |
| `home` | Pokój u Krysi | drzemka |
| `shop` | Żuczek | jedzenie, ciuchy |
| `kebab` | Nocna Buła | zmiana, własny lokal |

Praca (od G1, 2026-09-05): 5 firm i 15 stanowisk w `src/game/jobs.ts` (Nocna Buła, Żuczek, Nasza Kasa, PUP, Zajezdnia), podania i podwyżki w PUP, własny lokal jako 16. stanowisko. Kariera = prestiż aktualnego stanowiska, po zwolnieniu 0. Pełny model: `docs/projekt-glebia.md`.

Mieszkanie: tylko `stancja`. Czynsz start 400 zł, co 4 tygodnie płatność i podwyżka +50 zł. Nie ma przeprowadzki.

Event co koniec tury aktywnego gracza (równomierny rzut 8 ID): korek, lotto, pralka, teściowa, aukcje, kontrola, PIT, promocja.

---

## 5. Mapa kodu (gdzie szukać)

| Chcę… | Plik |
|---|---|
| Dodać akcję / zmienić koszty | `src/game/actions.ts`, copy w `src/i18n/pl.ts` i `src/ui/copy.ts` |
| Dodać event | `src/game/events.ts` + `EventId` w `types.ts` + karta `public/art/events/{id}.png` + `eventArtUrl` w `art.ts` + precache w `public/sw.js` |
| Zmienić bot | `src/game/bot.ts` |
| Zmienić zapis | `src/game/save.ts` (parser jest świadomie ścisły) |
| Zmienić UI planszy / HUD | `src/ui/render-app.ts`, `src/styles.css` |
| Zmienić ekran startu | `src/ui/setup.ts` |
| Podpiąć bitmapę | `src/ui/art.ts` (nazwa pliku = kontrakt) |
| Zmienić paletę | `src/theme/palette.ts` i tokeny CSS |
| Dodać język | dziś jest tylko `pl.ts`; `t()` nie ma fallbacku EN |

Nieużywane (zostały po SVG): `src/ui/glyphs.ts`, `src/ui/avatar-art.ts`. Można skasować, nic ich nie importuje.

---

## 6. Grafika: co jest i czego nie malować

Styl lock: HD pixel / dither, papier i tusz. Styl ustala program graficzny. Kod tylko zjada nazwane pliki.

**P0 i P1 są w `public/` i wpięte.** Nie ma kolejnej transzy bitmap, dopóki produkt nie będzie potrzebował P2.

| Zestaw | Stan |
|---|---|
| 9 kafelków 512×384 | jest |
| 4 portrety 512×512 + 4 pionki 256×256 (alfa) | jest |
| ikony PWA + favicon | jest |
| 8 kart eventów 768×1024 | jest |
| 8 ikon HUD 64×64 (alfa) | jest |
| mata 1600×1000 + pieczątka | jest |

P2 (brief mówi: nie malować): ekran zwycięstwa, splash, walk cycle, cutsceny, Lottie, dźwięk, nowe lokacje, pory dnia. Silnik tego nie ma.

`docs/warianty-grafiki/` to ślad wyboru stylu (linoryt / wycinanka / raster). Nie wchodzi do builda.

Przy nowym PNG: waga i wymiary z briefu, zero liter na kadrze, dopisać URL w `art.ts` i ścieżkę w `public/sw.js` (`CACHE_NAME` jest `mirkow-v3`; po zmianie assetów podbić wersję).

---

## 7. Założenia kontra stan

Źródło intencji: `docs/zalozenia.md`. Źródło cięć MVP: `docs/decyzje.md`. Poniżej stan kodu z 2026-09-05.

### 7.1 Zakres MVP z założeń §9

| Punkt MVP | Stan |
|---|---|
| Plansza 6–8 lokacji | **Jest.** 8 lokacji + skwer ozdobny. |
| Solo vs prosty bot | **Jest.** Kowalski, reguły w `bot.ts`. |
| Jedna ścieżka kariery, 2–3 poziomy | **Jest.** 3 szczeble Nocnej Buli. |
| 5–10 zdarzeń losowych | **Jest.** 8 eventów, zawsze jeden na koniec tury. |
| Zapis lokalny, bez kont | **Jest.** `localStorage`. |
| Wersja PL, EN opcjonalnie | **PL jest.** EN nie. Struktura `t(key)` jest, drugiego słownika nie ma. |

### 7.2 Mechanika z założeń, która jest

| Temat | Jak w kodzie |
|---|---|
| Cztery progi, wygrana jednoczesna | `hasWon` w `reducer.ts` |
| 1 tura = 1 tydzień, pula czasu | `TIME_MAX = 10` |
| Ruch kosztuje czas | graf + Dijkstra |
| Praca / nauka / zakupy / odpoczynek / szukanie pracy | akcje w tabeli wyżej |
| Czynsz okresowy + inflacja | co 4 tyg., +50 zł |
| Głód i brak ubrania | −2 czasu / −5 szczęścia |
| Siatka: ciocia / MOPS | 500 zł / 350 zł, gdy kasa ≤ 0 |
| Ceny fluktuują | Żuczek 80–130% bazy jedzenia i ciuchów |
| PIT / korek / Kupon Szczęścia itd. | eventy, nie pełny ZUS |
| 4 awatary, bez bonusów | Ola, Bartek, Nati, Marek |
| PWA + GitHub Pages (technicznie) | manifest, SW, `base: './'` |
| Satyra średnia, analogi marek | copy + briefy |

### 7.3 Z założeń: świadomie odłożone albo niezaimplementowane

To nie są bugi zapomnienia. Albo decyzja MVP je wycięła, albo silnik ma haczyk (kafelek), ale nie ma mechaniki.

| Z założeń / decyzji | Stan | Uwaga |
|---|---|---|
| Hot-seat 2–4 graczy | **Brak.** | Stan ma `players[]` i `active`, start zawsze robi 1 human + 1 bot. Decyzja: hot-seat po silniku. |
| Online multiplayer | **Brak.** | Poza MVP. |
| Tryb solo na czas (30 tur, punktacja) | **Brak.** | Jest tylko versus Kowalski. |
| Tryb spokojny vs przekręty (hexy) | **Brak.** | |
| EN | **Brak.** | |
| Nazwa i domena | **Otwarte.** | |
| Hosting / repo publiczne | **Brak.** | Nie ma remote. |
| Ranking, konta, backend | **Brak.** | |
| Giełda / aplikacja inwestycyjna | **Brak.** | |
| Przeprowadzka: kawalerka, kredyt | **Brak.** | Tylko stancja. |
| Lokaty, kredyt, ROR w banku | **Brak.** | `bank` jest na mapie, `actionsAt("bank") === []`. Test to utrwala. |
| Przychodnia / lekarz | **Brak.** | |
| Poczta / paczkomat | **Brak.** | |
| Urząd skarbowy jako lokacja | **Brak.** | PIT jest eventem. |
| Wiele ścieżek kariery | **Brak.** | Decyzja: tylko Nocna Buła. |
| Customizer (fryzura, kolor) | **Brak.** | Imię + wybór żetonu. |
| Umowa o pracę vs zlecenie jako mechanika | **Brak.** | |
| ZUS jako system | **Brak.** | Żart idzie przez PIT/eventy. |
| Ekran zwycięstwa / splash | **Tekst.** | Brak bitmapy P2. |
| Dźwięk | **Brak.** | Po grafikach, P2. |
| Phosphor na HUD | **Porzucone.** | Są bitmapy 64×64. |
| Plansza jako jeden duży SVG 1600×1000 | **Porzucone.** | Siatka DOM + mata PNG + SVG szyn. |

### 7.4 Dług i dziury w obecnym MVP

- ~~Nasza Kasa nic nie robi.~~ Od E3 (2026-09-05) bank ma lokatę.
- ~~Event leci zawsze.~~ Od E3 są karty „Spokojny tydzień” (waga 2,5) i „Napiwki”.
- Bot (od G5) gra całym systemem: cel kariery i dyplomy pod niego, praca do progu solidności, garnitur gdy blokuje podanie, naprawa sprzętu, rower, komputer, lodówka, telewizor, kawalerka i apartament, nadwyżka na konto powyżej celu, akcje w boomie i sprzedaż w recesji, mały kredyt na naukę, jedzenie na miejscu. Nie używa siłowni ani lokaty. `balance.test.ts` pilnuje, że bot kontra bot kończy normalną partię w 30–180 tygodni (typowo 63–83, krótka ok. 38, długa ok. 78).
- Zwycięstwo to zmiana fazy i napis, HUD zostaje.
- `glyphs.ts` / `avatar-art.ts` martwe.
- `docs/grafika.md` i część briefów opisują stan sprzed wpięcia P1 (Phosphor, „bitmapy później”).
- Brak E2E w przeglądarce (tylko unit).
- Brak CI.
- Service worker cache-first na fetch z sieci, precache trzeba ręcznie synchronizować z `public/art/`.

---

## 8. Liczby, których nie zgadywać

| Stała | Wartość | Gdzie |
|---|---|---|
| Pula czasu | 12 (od G1; wcześniej 10) | `catalog.ts` |
| Start kasy / szczęścia | 800 / 20 | `types.ts` |
| Mieszkania (od G3) | stancja 400 (3 miejsca, kradzieże), kawalerka 700 (6, +1 szczęścia/tydz., kaucja 1 czynsz), apartament 1200 (10, +3, kaucja). Czynsz zamrożony na stawce z dnia podpisania × koniunktura (boom 1,1, recesja 0,8), płatny co 4 tyg. Przeprowadzka 2 cz | `homes.ts` |
| Przedmioty | Elektro-Mir nowe (1% awarii/tydz.), Lombard używane za 60% (3%), skup 50%, naprawa 20%. Lodówka 900 (jedzenie 6 tyg.), pralka 800, kanapa 400, telewizor 700 (+1/tydz.), wieża 600 (+1), komputer 1800 (zajęcia −1 cz, egzamin +10%), encyklopedia 300 (egzamin +10%), rower 500 (trasy ≥2 o 1 krócej) | `items.ts` |
| Kradzież na stancji | 8% na tydzień, 12% przy ≥3 rzeczach, znika jeden przedmiot | `homes.ts`, `reducer.ts` |
| Szczęście co tydzień | −1 bazowo, plus komfort mieszkania i sprzętu | `types.ts` |
| Bank (od G4) | konto (wpłaty po 100, bezpieczne od kieszonkowca), kredyt do 6 płac za zmianę (min 500, kroki 500, 4% za 4 tyg., rata 25% kapitału + odsetki co 4 tyg., dwie zaległe = komornik zabiera przedmiot albo 20% gotówki), akcje MZT (start 50 zł, pakiety po 10, dryf boom +5..15%, recesja −5..15%, normalnie ±8%). Próg pieniędzy liczy majątek: gotówka + konto + lokata + akcje − kredyt | `bank.ts` |
| Weekend | co tydzień jedna z 22 linijek zależnych od sprzętu i mieszkania (−80..+120 zł, −2..+3 szczęścia) | `weekends.ts` |
| Zjedz na miejscu | Nocna Buła, 1 cz, 25 zł, +1 tydz. jedzenia, +1 szczęścia | `actions.ts` |
| Kieszonkowiec | event (waga 1): −10% gotówki, max 300 zł, konto nietknięte | `events.ts`, `bank.ts` |
| Start zapasów | jedzenie 2 tyg., ubranie 3 tyg. | `types.ts` |
| Lokata (Nasza Kasa) | 1 cz., 1000 zł, wypłata 1080 zł po 4 tyg., jedna naraz | `actions.ts` |
| Eventy | 10 kart, losowanie ważone: spokój 2,5, napiwki 1,5, reszta 1 | `events.ts` |
| Ciocia / MOPS | 500 / 350 | `types.ts` |
| Zmiana | 3 cz., płaca wg stanowiska (220–950 zł) × podwyżki × koniunktura, +1 staż, +4 solidności | `jobs.ts`, `actions.ts` |
| Solidność | start 20, −3 co tydzień, zwolnienie 10 pkt poniżej wymagania stanowiska | `jobs.ts`, `reducer.ts` |
| Podwyżka | w PUP, 1 cz., staż na stanowisku 8 tyg. × (n+1), solidność ≥ min + 10, +10%, max 2 | `jobs.ts` |
| Koniunktura | losowana co 8 tyg.: boom (płace +15%), normalnie, recesja (płace −15%, jedna firma nie zatrudnia, redukcja 10% gdy solidność < min + 5) | `economy.ts` |
| Garnitur | Lombard, 1 cz., 350 zł, 6 tyg.; wymagany w banku, PUP, u kierownika sklepu i dyrektorów | `actions.ts` |
| Własny lokal | dla kierownika zmiany Nocnej Buły, buy-in 1800, staż 16, solidność 40, prestiż 70 | `jobs.ts` |
| Dyplomy (od G2) | 7 dyplomów w `diplomas.ts`: kurs 4 zajęć/10 pkt, matura 6/15, zarządzanie, ekonomia, administracja 8/20 (po maturze), inżynieria 10/25 (po maturze), magister 10/30 (po licencjacie). Zajęcia 3 cz (magister 4), 100–400 zł | `diplomas.ts` |
| Egzamin | 2 cz, 80 zł, szansa 40% + 10% za każde zajęcia z ostatnich 4 tyg. (max 100%); oblany: −3 szczęścia, powtórka | `diplomas.ts`, `reducer.ts` |
| Wykształcenie | suma punktów dyplomów (max 100 na pasku) | `diplomas.ts` |
| Jedzenie / ciuchy | 1 cz., 2 tyg. zapasu / 1 cz., 3 tyg. | `actions.ts` |
| Głód / nagość | −2 czasu / −5 szczęścia | `actions.ts` |
| Domyślne progi | 5000 / 80 / 60 / 50 | `state.ts` `DEFAULT_GOALS` |

RNG: deterministyczny (`src/game/rng.ts`), seed w stanie. Eventy można wymusić w testach przez `firstSeedFor(id)`.

---

## 9. Proponowana kolejność dalszych prac

Nie malować P2, dopóki produkt tego nie zamówi.

1. **Playtest do zwycięstwa** i spis zgrzytów (tempo, czynsz, bank-pusty, siła bota).
2. **Domknąć albo wyjaśnić bank** (mecyja albo usunąć z planszy).
3. **Publikacja:** nazwa, repo, GitHub Pages, pierwszy commit.
4. **Sprzątanie:** martwe SVG, aktualizacja `docs/grafika.md` pod bitmapy.
5. **Hot-seat**, gdy silnik tur ma zostać wieloosobowy (tablica graczy już jest).
6. **EN** jako drugi słownik, gdy ma iść publicznie jak Blokado.
7. Dopiero potem: mieszkania, giełda, druga kariera, dźwięk, ekran zwycięstwa.

---

## 10. Indeks dokumentów

| Plik | Czytać jako |
|---|---|
| `CZYTAJ-TO.md` | aktualny stan i luki |
| `CLAUDE.md` | reguły kodu dla AI |
| `docs/zalozenia.md` | pierwotna intencja (część jest nieaktualna) |
| `docs/decyzje.md` | cięcia MVP z 3 września 2026 |
| `docs/grafika.md` | paleta; kolejność P0/P1 (pliki już są) |
| `docs/brief-bitmapy.md` | wymiary i zakazy na PNG |
| `docs/brief-p1.md` | spec 7 kart + HUD + mata (dostarczone) |
| `docs/warianty-grafiki/` | archiwum prób, nie pipeline |

Pytania do właściciela produktu, nadal otwarte: ostateczna nazwa, domena, czy bank ma dostać mechanikę, czy hot-seat jest następnym trybem, czy publikujemy przed playtestem.
