# Project Instructions

Turowa gra **Symulator życia** (Mirków). Vite + TypeScript, vanilla DOM, Vitest. Wejście dla ludzi: `CZYTAJ-TO.md`.

## Stack

- TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Vite `base: './'` (GitHub Pages)
- UI: DOM, bez React/Vue
- Testy: `npm test` → `src/**/*.test.ts`; smoke e2e: `npm run build && npm run test:e2e` (Playwright, `e2e/`)
- Dev: `npm run dev` / build: `npm run build`; CI: `.github/workflows/ci.yml` (test, build, Playwright), deploy na Pages: `deploy.yml` (ręcznie)

## Granice

- Silnik (`src/game/`) nie importuje DOM.
- Mutacja stanu tylko przez `dispatch` → `EngineResult`.
- Copy gracza wyłącznie w `src/i18n/pl.ts` (bez em dash, analogi marek).
- Bitmapy: źródła PNG w `art-src/art/`, gra serwuje WebP z `public/art/` (`npm run art:webp`, wymaga Pythona z Pillow). Nazwy w `src/ui/art.ts` = pliki `.webp`. Zero tekstu i logotypów na bitmapach.
- Nie dodawać Lottie, GIF, walk cycle, @2x, ani nowych lokacji „przy okazji”. Dźwięk jest syntetyzowany w `src/ui/audio/` (Web Audio, bez plików), patrz `docs/audio.md`.

## Wzorce

- `switch` po uniach: `default` + `assertNever`.
- Importy na górze pliku.
- Nowe ID (akcja, event, lokacja): types → def → i18n → UI → test → ewentualnie PNG do `art-src/` + `npm run art:webp`. Service worker generuje `vite-plugin-pwa` (precache z hashami, bez ręcznego bumpowania).
- Zapis: `mirkow.save.v5` (`version: 5`), parser w `save.ts` odrzuca śmieci; stare klucze v1–v4 dają status `outdated`.

## Tego nie ruszać bez decyzji produktowej

- Pory dnia na kafelkach, walk cycle (P2 z 2026-09-05 jest wpięte: panorama, Kowalski, ikony akcji, ciemna mata, laur). Dźwięk: decyzja podjęta 2026-09-05, patrz `docs/audio.md`.
- Online / backend.
- Podmiana stacku na React.

## Warstwa UI (po redesignie 2026-09-05)

- `src/ui/app.ts` pętla i przepływ tury (ruch, akcja, koniec tygodnia, replay bota)
- `src/ui/board.ts` plansza, tory, pionki, animacja po `travelPath`
- `src/ui/panel.ts` karta miejsca, postać z kwestią (`npcLine` w `copy.ts`, `public/art/npc/`), akcje z powodem blokady (`actionBlock`), koniec tygodnia; na telefonie dolny arkusz (`setOpen`)
- `src/ui/jobs-board.ts` tablica ofert w PUP (`jobBlock`, `raiseBlock`)
- `src/ui/work.ts` karta pracy w HUD: stanowisko, płaca, solidność z minimum, staż
- `src/ui/campus.ts` indeks w WSMiK (`enrollBlock`, szansa egzaminu)
- `src/ui/home.ts` pokój z przedmiotami (sprite'y na strefach A/B/C) i umowy mieszkań
- `src/ui/shops.ts` Elektro-Mir (nowe, naprawa) i Lombard (używane, skup)
- `src/ui/bank.ts` Nasza Kasa: konto, kredyt, akcje z wykresem
- `src/ui/hud.ts` pasek górny, bilety czasu, cel tygodnia (`weekGoal`), staty, wiersz Kowalskiego, potrzeby
- `src/ui/overlays.ts` karta eventu (z weekendem), karta zasad na start, karta Kowalskiego z miną, ekran zwycięstwa
- `src/ui/journal.ts` dziennik tygodnia (stan UI, nie zapis)
- `src/ui/setup.ts` ekran startu z presetami długości partii
- `src/ui/audio/` muzyka i efekty na Web Audio: `song.ts` (utwór jako dane), `engine.ts` (scheduler, instrumenty, efekty, przełączniki)
- `src/styles/*.css` tokeny (jeden ciemny motyw, zablokowany), base, game, overlays, setup
- `src/ui/heading.ts` nagłówek listy z regułami pod „i”; `src/ui/count.ts` przewijanie liczb; `src/ui/feedback.ts` przyrosty wylatujące nad zmienioną liczbą

## Interfejs: reguły z audytu 2026-09-11 (`docs/audyt-design-2026-09-11.md`)

- Pismo tylko z czterech tokenów: `--fs-xs` 12, `--fs-s` 14, `--fs-m` 16, `--fs-l` 22. Bez stopni pośrednich.
- Wypełnienie akcentem tylko dla tego, co można kliknąć teraz (przycisk główny, podpowiedź kafelka) i dla pieczątki koniunktury. Ostrzeżenia kolorem tekstu.
- Nie dodawać zdania, które powtarza pasek celu, opis miejsca albo kwestię postaci.
- Reguły list chowają się pod „i” (`buildBoardHeading`), nie stoją nad listą.
- Zmiana liczby musi być widoczna w miejscu, gdzie ta liczba stoi (`countTo`, `floatChange`).
- Grafiki kart zdarzeń i winiet weekendów są przycięte do samego motywu, a układ bierze proporcje z pliku. Nie dorysowywać w pliku pustego miejsca na tekst i nie wymuszać jednego kadru w CSS.
- **Każda lista jest przedmiotem, który przedstawia.** Nie sprowadzać kolejnych miejsc do wspólnego wiersza „ikona, nazwa, opis, liczba po prawej”: PUP to tablica z kartkami (`.cork`, `.offer`), WSMiK ma być indeksem, sklepy półką, dom umową, bank książeczką. Wspólna jest paleta, skala pisma, papier i pieczątka; różny ma być przedmiot. Patrz `docs/audyt-design-2026-09-11.md` §10.
- Sam materiał nie wystarczy: jednakowe prostokąty jeden pod drugim to dalej tabela, choćby były z papieru. Trzeba złamać strukturę: pole dwuwymiarowe, różna wielkość elementu niosąca znaczenie, przesunięcie i przechył, żeby krawędź nie była linią prostą.
- Panele miejsc chowa się atrybutem `hidden`. W `base.css` jest globalna reguła `[hidden] { display: none !important }`, bo bez niej wystarczy nadać elementowi `display` na klasie, żeby `hidden` przestało działać i panel jednego miejsca pokazywał się we wszystkich.
- Ekran gry na desktopie mieści się w jednym oknie (`.game { height: 100dvh }`). Panel miejsca dostaje wysokość wiersza, a przewija się tylko `.panel-body`: zdjęcie miejsca, kwestia postaci i przycisk końca tygodnia zostają na wierzchu. Panel rozpięty na kilka wierszy musi mieć `align-self: stretch` i `min-height: 0`, inaczej rośnie z treścią i wypycha stronę.

Kierunek wizualny: „Wieczór w Mirkowie”, patrz `docs/przeglad-2026-09-05.md`. Briefy grafik: `docs/brief-p2.md`, `brief-p3.md`, `brief-p4.md`, `brief-p5.md`, `brief-p7.md` (SpriteCook). Identyfikatory wzorców stylu: `spritecook-assets.json`. Audyt UX i status napraw: `docs/audyt-ux-2026-09-05.md`.