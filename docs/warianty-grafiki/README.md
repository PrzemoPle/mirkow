# Warianty grafiki P0

Trzy kierunki na bitmapy z [brief-bitmapy.md](../brief-bitmapy.md), pokazane na tych samych trzech kafelkach (stancja, Żuczek, Nocna Buła), portrecie Oli i jej pionku.

| Folder | Kierunek | W skrócie |
|---|---|---|
| `linoryt/` | A. Linoryt | gruba, drżąca kreska tuszem, plamy koloru z misregistracją, ziarno papieru |
| `wycinanka/` | B. Wycinanka | warstwy papieru bez obrysu, cień pod każdym kształtem, włókno kartonu |
| `halftone/` | C. Raster | cienki obrys, dwie tinty i kropka rastrowa, retro offset |

Pliki mają dokładne wymiary z briefu: kafelki 512×384 (nieprzezroczyste), portret 512×512 i pionek 256×256 (alfa). Nazwy odpowiadają mapie `art/tiles/*.png`, `art/avatars/*.png`, `art/pawns/*.png`.

## Jak powstały

`gen.mjs` trzyma jedną definicję każdej sceny (prymitywy z rolami kolorów: `base`, `baseDark`, `paper`, `ink`, `token`) i trzy renderery stylu. `raster.sh` rasteryzuje SVG przez Chrome headless do PNG z alfą.

```bash
node gen.mjs && ./raster.sh
```

Wybrany styl rozszerza się na pozostałe 6 kafelków, 3 portrety, 3 pionki i ikony PWA w tym samym pliku, bez dryfu między kadrami (wspólny horyzont y=250, wspólna paleta, ten sam ciężar kreski).

## Wersja malarska (opcja)

Jeśli zestaw ma być namalowany, a nie wycięty z wektorów, [prompty.md](prompty.md) zawiera prompty w trzech powyższych kierunkach dla generatora obrazu (fal.ai Nano Banana Pro, ludo.ai, GPT Image). Ta ścieżka wymaga podpięcia klucza: dziś żaden konektor w Claude Code nie generuje obrazów.
