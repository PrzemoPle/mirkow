# Symulator życia

Turowa satyra życia w fikcyjnym polskim mieście **Mirków**. Inspiracja: Jones in the Fast Lane / No Time to Relax.

Gracz ma pulę czasu na tydzień, chodzi po mapie i zbiera cztery progi: pieniądze, szczęście, wykształcenie, kariera. Przeciwnik: bot Kowalski.

**Pełny opis gry, budowy i decyzji:** [OPIS-GRY.md](OPIS-GRY.md)

**Starszy handoff z tabelą liczb:** [CZYTAJ-TO.md](CZYTAJ-TO.md)

## Uruchomienie

```bash
npm install
npm test
npm run dev
```

Build na GitHub Pages: `npm run build` (katalog `dist/`, `base: './'`).

## Stack

Vite, TypeScript, vanilla DOM, Vitest. Stan gry to jeden obiekt JSON. Bez frameworka UI.

## Dokumentacja

- [CZYTAJ-TO.md](CZYTAJ-TO.md) - paczka dla kolejnej osoby
- [Przegląd i plan zmian (2026-09-05)](docs/przeglad-2026-09-05.md) - diagnoza wyglądu i kolejność prac
- [Projekt „Głębia”](docs/projekt-glebia.md) - jak Mirków ma dorównać Jonesowi: praca, nauka, dom, pieniądze
- [Założenia](docs/zalozenia.md) - pierwotna intencja
- [Decyzje](docs/decyzje.md) - cięcia MVP
- [Grafika](docs/grafika.md) - paleta i bitmapy
