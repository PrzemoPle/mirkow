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
- Nie dodawać Lottie, GIF, walk cycle, @2x, dźwięku, ani nowych lokacji „przy okazji”.

## Wzorce

- `switch` po uniach: `default` + `assertNever`.
- Importy na górze pliku.
- Nowe ID (akcja, event, lokacja): types → def → i18n → UI → test → ewentualnie PNG do `art-src/` + `npm run art:webp`. Service worker generuje `vite-plugin-pwa` (precache z hashami, bez ręcznego bumpowania).
- Zapis: `mirkow.save.v5` (`version: 5`), parser w `save.ts` odrzuca śmieci; stare klucze v1–v4 dają status `outdated`.

## Tego nie ruszać bez decyzji produktowej

- Pory dnia na kafelkach, walk cycle, dźwięk (P2 z 2026-09-05 jest wpięte: panorama, Kowalski, ikony akcji, ciemna mata, laur).
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
- `src/styles/*.css` tokeny (jeden ciemny motyw, zablokowany), base, game, overlays, setup

Kierunek wizualny: „Wieczór w Mirkowie”, patrz `docs/przeglad-2026-09-05.md`. Briefy grafik: `docs/brief-p2.md`, `brief-p3.md`, `brief-p4.md`, `brief-p5.md`. Audyt UX i status napraw: `docs/audyt-ux-2026-09-05.md`.
