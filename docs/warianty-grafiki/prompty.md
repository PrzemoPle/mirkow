# Paczka promptów: wersja malarska P0

Do użycia, gdy podepniesz generator obrazu (fal.ai `nano-banana-pro`, ludo.ai, GPT Image). Bez klucza nic z tego nie uruchomię. Prompty są po angielsku, bo tak modele trzymają styl najstabilniej.

## Zasady, które chronią przed „AI slopem”

1. **Najpierw kotwica stylu.** Wygeneruj jeden kadr (Żuczek), wybierz najlepszy, potem każdy kolejny kafelek generuj z tym obrazem jako referencją stylu (`image_url` / `style_asset_ids`). Bez kotwicy dostaniesz 9 różnych ilustratorów.
2. **Stały seed na zestaw.** Ten sam `seed` dla wszystkich kafelków jednej transzy.
3. **Jedna pora dnia w każdym promptcie.** Późne popołudnie, miękkie światło z lewej, horyzont w dolnej trzeciej kadru.
4. **Zakaz tekstu w promptcie i w negatywie.** Nawet „sign with lettering” ściągnie napisy.
5. **Motyw w górnych 68%.** Prompt zawsze kończy się zdaniem o pustym chodniku na dole.
6. **Odrzucaj, nie poprawiaj.** Kadr z napisem, logo, twarzą celebryty lub trzema drzwiami idzie do kosza. Nie retuszuj.
7. **Rozdzielczość generatora 1024 lub 2048, potem skalujesz w dół** do 512×384 (Lanczos). Nie odwrotnie.

## Wspólny trzon (doklejany do każdego promptu)

```
Flat printed illustration for a board game tile, fictional small Polish city, late afternoon soft light from the left, horizon in the lower third, muted palette on warm paper #E8DCC8 with ink #2B2622, one clear silhouette, minimal background detail, bottom third of the frame is empty pavement with no objects, no text, no letters, no numbers, no logos, no signage lettering, no people's faces in close-up.
```

Negatyw:

```
text, letters, typography, watermark, logo, brand, photo, photorealistic, 3D render, neon, glow, gradient sky, lens flare, cyberpunk, pixel art, blurry, extra buildings, cluttered, anime
```

## Trzy style (wybierz jeden, ten sam co w wektorach)

**A. Linoryt**
```
linocut print style, thick hand-cut black ink outlines, flat spot colors slightly misregistered, visible paper grain, Polish poster school, bold shapes
```

**B. Wycinanka**
```
layered cut-paper illustration, no outlines, soft short drop shadows between paper layers, cardboard fiber texture, tactile board-game token feel
```

**C. Raster**
```
retro offset print, thin ink outline, two-tone color with halftone dot shading, 1970s Polish tourist postcard, slightly worn paper
```

## Kafelki 512×384 (aspect 4:3, `image_size: landscape_4_3`)

| Plik | Prompt sceny |
|---|---|
| `tiles/pup.png` | Waiting room of a small employment office: two rows of plastic benches, one service window with a closed blind, a fluorescent tube light, a tired potted plant, beige walls. Dominant color #C4B8A4. |
| `tiles/campus.png` | Brutalist university campus: three raw concrete blocks of different heights, a bicycle locked to a rack in front, a few small windows. Dominant color #6B4F7A. |
| `tiles/bank.png` | Facade of a small cooperative bank: heavy door, round safe-dial motif carved above the door, two barred windows. No emblem, no lettering. Dominant color #3D6B8C. |
| `tiles/cafe.png` | Corner café on a street corner with a red tram stop pole and a passing tram in the background, two café chairs outside. Dominant color #A45C4A. |
| `tiles/gym.png` | Basement gym seen through a half-window at street level: one barbell with plates, black rubber mat, a hanging towel. Dominant color #3F7A6B. |
| `tiles/home.png` | Old tenement house facade with a clothesline of laundry strung across, one lit window with a cat silhouette on the sill, a drainpipe. Dominant color #8B6B4A. |
| `tiles/shop.png` | Small discount grocery with a striped yellow-and-cream awning and a black beetle emblem on the sign board (shape only), a shopping cart outside. Dominant color #E2B84A. |
| `tiles/kebab.png` | Night kebab kiosk with a service window, a rotating meat spit visible inside, steam curling up, a hanging bulb, a side door. Dominant color #D4652F. |
| `tiles/park.png` | Small town square: one bench, two round trees, one pigeon on the ground, a low hedge. Dominant color #7A8F6A. |

## Portrety 512×512 (`image_size: square`)

Trzon: `bust portrait, adult, fictional person, head centered, shoulders visible, plain circular background in the token color, same head size in every portrait, no text`.

| Plik | Rysopis | Kolor ubrania |
|---|---|---|
| `avatars/ola.png` | round glasses, dark chin-length hair, calm neutral expression | #D4652F |
| `avatars/bartek.png` | baseball cap with visor, short hair, slight smirk | #3D6B8C |
| `avatars/nati.png` | curly hair in two high buns, big earrings | #6B4F7A |
| `avatars/marek.png` | full beard, receding hairline, older than the others, reading glasses on the forehead | #3F7A6B |

## Pionki 256×256 (alfa)

Generatory słabo trzymają przezroczystość. Rób: pionek na jednolitym tle `#00FF00`, potem usuwasz tło (Photoroom przez Composio albo `remove_background` w godmodeai) i sprawdzasz 10% marginesu pustki.

```
single board-game meeple figure, full body silhouette centered with 10% empty margin, [styl], solid clothing color [hex], distinguishing hat or hair shape only, no face detail, flat green background #00FF00
```

## Kontrola po wygenerowaniu (checklista na kadr)

- [ ] zero liter, cyfr, logo
- [ ] motyw mieści się w górnych 68%, dół to sam chodnik
- [ ] czyta się jako sylwetka po zmniejszeniu do 110×80
- [ ] ta sama pora dnia i kierunek światła co kotwica
- [ ] kolor dominujący zgadza się z tokenem kafelka
- [ ] ciemne kafelki (bank, campus, gym, cafe, home, kebab) mają ciemny dół pod jasny napis
