# Project Instructions

Turowa gra **Symulator życia** (Mirków). Vite + TypeScript, vanilla DOM, Vitest. Wejście dla ludzi: `CZYTAJ-TO.md`.

## Stack

- TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Vite `base: './'` (GitHub Pages)
- UI: DOM, bez React/Vue
- Testy: `npm test` → `src/**/*.test.ts`
- Dev: `npm run dev` / build: `npm run build`

## Granice

- Silnik (`src/game/`) nie importuje DOM.
- Mutacja stanu tylko przez `dispatch` → `EngineResult`.
- Copy gracza wyłącznie w `src/i18n/pl.ts` (bez em dash, analogi marek).
- Bitmapy: nazwy w `src/ui/art.ts` = pliki w `public/art/`. Zero tekstu i logotypów na PNG.
- Nie dodawać Lottie, GIF, walk cycle, @2x, dźwięku, ani nowych lokacji „przy okazji”.

## Wzorce

- `switch` po uniach: `default` + `assertNever`.
- Importy na górze pliku.
- Nowe ID (akcja, event, lokacja): types → def → i18n → UI → test → ewentualnie PNG + `public/sw.js` (podbić `CACHE_NAME`).
- Zapis: `mirkow.save.v3` (`version: 3`), parser w `save.ts` odrzuca śmieci; stare klucze v1/v2 dają status `outdated`.

## Tego nie ruszać bez decyzji produktowej

- Pory dnia na kafelkach, walk cycle, dźwięk (P2 z 2026-09-05 jest wpięte: panorama, Kowalski, ikony akcji, ciemna mata, laur).
- Online / backend.
- Podmiana stacku na React.

## Warstwa UI (po redesignie 2026-09-05)

- `src/ui/app.ts` pętla i przepływ tury (ruch, akcja, koniec tygodnia, replay bota)
- `src/ui/board.ts` plansza, tory, pionki, animacja po `travelPath`
- `src/ui/panel.ts` karta miejsca, akcje z powodem blokady (`actionBlock`), koniec tygodnia
- `src/ui/jobs-board.ts` tablica ofert w PUP (`jobBlock`, `raiseBlock`)
- `src/ui/work.ts` karta pracy w HUD: stanowisko, płaca, solidność z minimum, staż
- `src/ui/campus.ts` indeks w WSMiK (`enrollBlock`, szansa egzaminu)
- `src/ui/hud.ts` pasek górny, bilety czasu, staty, potrzeby
- `src/ui/overlays.ts` karta eventu, ekran zwycięstwa
- `src/ui/journal.ts` dziennik tygodnia (stan UI, nie zapis)
- `src/ui/setup.ts` ekran startu z presetami długości partii
- `src/styles/*.css` tokeny (jeden ciemny motyw, zablokowany), base, game, overlays, setup

Kierunek wizualny: „Wieczór w Mirkowie”, patrz `docs/przeglad-2026-09-05.md`. Grafiki do zamówienia: `docs/brief-p2.md`.
