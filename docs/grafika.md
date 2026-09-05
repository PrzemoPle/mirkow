# Grafika MVP

**Stan 2026-09-05:** P0 i P1 są w `public/art/` i wpięte w UI. Ikony HUD to bitmapy 64×64, nie Phosphor. Plansza to siatka DOM + mata PNG + SVG szyn, nie jeden SVG 1600×1000. P2 nie malować. Pełny status: [../CZYTAJ-TO.md](../CZYTAJ-TO.md).

Kierunek: tydzień w polskim mieście jako papierowa plansza z żetonami. Nie pixel-VGA, nie cyberpunk, nie dashboard SaaS.

## Paleta

| Token | Hex | Użycie |
|---|---|---|
| paper | `#E8DCC8` | tło |
| ink | `#2B2622` | tekst |
| road | `#4A5560` | ulice |
| park | `#7A8F6A` | skwer |
| pup | `#C4B8A4` | PUP |
| shop | `#E2B84A` | Żuczek |
| kebab | `#D4652F` | Nocna Buła + akcent HUD |
| bank | `#3D6B8C` | bank |
| campus | `#6B4F7A` | WSMiK |
| gym | `#3F7A6B` | siłka |
| cafe | `#A45C4A` | kawiarnia |
| home | `#8B6B4A` | stancja |

Jedna rodzina krojów: Outfit (self-host). Ikony HUD: Phosphor od Sprintu 2. Na grafikach bitmapowych: zero tekstu i logotypów.

## Plansza (Sprint 2)

SVG `viewBox="0 0 1600 1000"`. Układ:

```
[PUP] ---- [WSMiK] ---- [Bank]
    |          |           |
[Na Rogu]   [skwer]    [Siłka]
    |          |           |
[Stancja] -- [Żuczek] -- [Nocna Buła]
```

Pionek to kółko w kolorze awatara, animacja `transform` 280-400 ms. `prefers-reduced-motion`: 0 ms.

## Bitmapy (nie blokują gry)

Pełny brief dla programu graficznego: [brief-bitmapy.md](brief-bitmapy.md). Styl ustalasz w programie. Tu zostaje tylko kolejność.

| Priorytet | Pliki | Kiedy |
|---|---|---|
| P0 placeholdery | favicon.svg, icon-192/512.png | Sprint 0 (geometryczne) |
| P0 | 9 kafelków 512×384 (8 lokacji + skwer) | podłączenie po eksporcie |
| P0 | 4 awatary 512×512 + 4 pionki 256×256 | podłączenie po eksporcie |
| P1 | 8 kart eventów 768×1024 | po P0 |
| P1 | ikony HUD 64×64, mata 1600×1000, pieczątka | po P0 |

Animacje cutscen / Lottie / walk cycle: nie. Pionek jeździ CSS `transform` 280-400 ms. Dźwięk: osobno, po grafikach.
