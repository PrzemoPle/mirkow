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
- Zapis: `mirkow.save.v1`, parser w `save.ts` odrzuca śmieci.

## Tego nie ruszać bez decyzji produktowej

- P2 grafiki (splash, zwycięstwo, pory dnia).
- Online / backend.
- Podmiana stacku na React.

Martwy kod do usunięcia gdy sprzątasz: `src/ui/glyphs.ts`, `src/ui/avatar-art.ts`.
