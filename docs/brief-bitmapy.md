# Brief graficzny: bitmapy do Symulatora życia (Mirków)

Dokument dla opracowania w programie graficznym. Styl malarski, kreskę i fakturę ustalasz u siebie. Tu są tylko: treść kadrów, formaty, wymiary, nazwy plików i to, jak gra je podepnie.

Gra to turowa planszówka o tygodniu w fikcyjnym **Mirkowie** (poznański koloryt, bez realnych dzielnic). Inspiracja: Jones in the Fast Lane. Satyra średnia: urząd, kebab, tramwaj, PIT, MOPS. Nie cyberpunk, nie pixel-VGA, nie dashboard SaaS.

Tekst w grze jest po polsku i leży w CSS. Na bitmapach **zero napisów, numerów, logotypów i marek**. Analogi zamiast oryginałów: Żuczek (nie Biedronka), Nocna Buła (nie konkretna sieć), Aukcje.pl (nie Allegro), Kupon Szczęścia (nie Lotto).

---

## 1. Co gra już ma, co ma zastąpić bitmapa

| Warstwa | Teraz | Po podłączeniu |
|---|---|---|
| 8 lokacji + skwer | kolor kafelka + SVG-stempel | ilustracja wypełnia kafelek, nazwa i koszt zostają jako tekst na dole |
| 4 awatary | portret SVG w kółku | ten sam kadr, bitmapa, przycinana do koła w CSS |
| pionki | meeple SVG w kolorze żetonu | pionek-bitmapa z przezroczystością, 28 px na planszy |
| event tygodnia | jedna linijka tekstu | karta + ten sam tekst obok |
| HUD (czas, staty, potrzeby) | kropki i paski | opcjonalne ikony 64 px, nie blokują gry |
| ikony PWA | placeholdery geometryczne | znak gry (tramwaj / pieczątka miasta) |
| tory, nazwy, przyciski | CSS | zostają w kodzie, nie rysujesz UI chrome |

Silnik nie odtwarza wideo ani Lottie. Ruch pionka to już CSS `transform` 320 ms. Bitmapy są klatkami nieruchomymi.

---

## 2. Format, kolor, dostawa

**Eksport do gry (to wrzucasz do repo):**

- **PNG-24 + alfa** albo **WebP lossless + alfa**. Jedna konwencja na cały zestaw, nie mieszaj.
- Przestrzeń **sRGB**, 8 bitów na kanał. Bez CMYK.
- Skala **1× w podanych pikselach**. Nie eksportuj @2x jako osobnych plików. Wymiary niżej już są 3–8× wyświetlania.
- Nazwy plików: **małe litery, myślniki, dokładnie jak w tabelach**. Gra mapuje ID 1:1 na nazwę.
- Bez profilu Adobe RGB, bez warstw, bez metadanych z nazwiskiem klienta jeśli nie chcesz.

**Źródła (zostają u Ciebie, nie w repo gry):**

- PSD / AFDESIGN / CLIP / Procreate. Warstwy luźne. Osobny folder `zrodla/`, nie `public/`.

**Folder w grze, po wrzuceniu:**

```
public/art/
  tiles/
  avatars/
  pawns/
  events/
  ui/
  brand/
```

Vite serwuje `public/` jako katalog główny. Podłączenie: mapa ID → `./art/tiles/pup.webp` itd. Brak pliku = obecny SVG zostaje (gra nie pada).

**PWA:** `icon-192.png`, `icon-512.png`, `apple-touch-180.png` idą do `public/` (nie do `art/`), bo już są wpisane w manifest.

---

## 3. Priorytety (kolejność malowania)

### P0, bez tego plansza dalej wygląda jak prototyp

21 plików. To wsad, który podłączę od razu.

### P1, tydzień i HUD dostają charakter

8 kart eventów + 8 ikon HUD + 1 mata planszy + 1 znak pieczątki. Podłączę w drugiej transzy.

### P2, nie maluj teraz

Ekran zwycięstwa, splash, walk cycle, cutsceny, Lottie, dźwięk, dodatkowe lokacje, warianty pory dnia. Silnik tego nie ma.

---

## 4. P0: kafelki lokacji

**Wymiar:** `512 × 384` (4:3).  
**Kadr:** pełne pole, bez zaokrągleń. CSS sam obcina `border-radius: 8px`.  
**Tło:** nieprzezroczyste. Możesz zostawić fakturę papieru w kadrze.  
**Tekst:** żaden. Gra dokłada na dole nazwę i koszt (`2 cz.`, `Tu jesteś`).

**Strefa martwa (ważna):** dolne **32%** kadru (`ok. 123 px`) to pasek na napis. Motyw przewodni trzymaj w górnych 68%. Dół może mieć grunt, chodnik, cień, nie twarz ani szyld.

Wyświetlanie: na telefonie kafelek ma ok. `110 × 80 px`, na desktopie ok. `200 × 100 px`. Kadr musi czytać się w miniaturze: jeden motyw, mocna sylwetka, mało detalu w tle.

Kolory tokenów to podpowiedź palety kafelka, nie obowiązek. Jeśli malujesz inaczej, zachowaj czytelny kontrast pod czarny (`#2B2622`) albo jasny (`#E8DCC8`) napis. W kodzie ciemne kafelki (bank, campus, gym, cafe, home, kebab) dostają jasny tekst.

| Plik | ID | Miejsce w grze | Co narysować |
|---|---|---|---|
| `tiles/pup.png` | `pup` | PUP Mirków, rząd 1 kol. 1 | Poczekalnia urzędu pracy: ławki, okienko z numerkiem, nuda, świetlówka. Beż `#C4B8A4`. |
| `tiles/campus.png` | `campus` | WSMiK, rząd 1 kol. 2 | Brutalistyczny kampus, trzy bloki, rower przy stojaku. Fiolet `#6B4F7A`. |
| `tiles/bank.png` | `bank` | Nasza Kasa, rząd 1 kol. 3 | Wnętrze albo fasada małego banku spółdzielczego, sejf / tarcza zamka. Nie logo banku. Granat `#3D6B8C`. |
| `tiles/cafe.png` | `cafe` | Na Rogu, rząd 2 kol. 1 | Narożny lokal + tramwaj albo słupek przystanku. Cegła `#A45C4A`. |
| `tiles/gym.png` | `gym` | Siłka Rzeźba, rząd 3 (środek-prawo, rząd 2 kol. 3) | Suterenowa siłownia, sztanga, gumowa mata. Zieleń `#3F7A6B`. |
| `tiles/home.png` | `home` | Pokój u Krysi, rząd 3 kol. 1 | Kamienica, sznur z praniem, okno pokoju na stancji. Brąz `#8B6B4A`. |
| `tiles/shop.png` | `shop` | Żuczek, rząd 3 kol. 2 | Dyskont z pasiastą markizą i żukiem (chrząszcz) jako znak. Żółć `#E2B84A`. Nie Biedronka, nie Lidl. |
| `tiles/kebab.png` | `kebab` | Nocna Buła, rząd 3 kol. 3 | Nocne okienko, para, zawinięta buła / kebab. Pomarańcz `#D4652F`. |
| `tiles/park.png` | `park` | Skwer, środek 2×2 | Ławka, dwa drzewa, gołąb. Zieleń `#7A8F6A`. To nie jest przycisk, tylko dekoracja środka. |

Układ planszy (tak leżą w grze):

```
[PUP] ---- [WSMiK] ---- [Nasza Kasa]
  |           |              |
[Na Rogu]   [Skwer]      [Siłka]
  |           |              |
[Stancja] -- [Żuczek] -- [Nocna Buła]
```

Dziewięć kadrów ma wyglądać jak jedna plansza rozcięta na pola: spójne światło, horyzont i pora dnia. Nie dziewięć stylów z różnych moodboardów.

---

## 5. P0: awatary (portrety)

**Wymiar:** `512 × 512`.  
**Kadr:** popiersie, głowa mniej więcej w środku. CSS wycina **koło**.  
**Tło:** przezroczyste albo pełne w kolorze żetonu. Jeśli malujesz tło, trzymaj je w kole: narożniki i tak znikną.  
**Tekst:** żaden. Imię (Ola / Bartek / Nati / Marek) jest pod spodem w UI.

Wyświetlanie: wybór na secie `66 × 66 px`, w HUD `41 × 41 px`. Twarz i jeden rekwizyt muszą trzymać się w 40 px.

To żetony wyglądu, **bez bonusów**. Cztery osoby dorosłe, fikcyjne, bez podobieństwa do realnych celebrytów. Różne sylwetki i fryzury, ten sam „wzrost” w kadrze (żeby siatka 4 kółek była równa).

Kolor ubrania = kolor pionka na planszy. Jeśli zmieniasz paletę postaci, zmień spójnie portret i pionek.

| Plik | ID | Kolor żetonu | Rekwizyt / rysopis (treść, nie styl) |
|---|---|---|---|
| `avatars/ola.png` | `ola` | `#D4652F` kebab | Okulary, ciemniejsze włosy, spokojna mina. |
| `avatars/bartek.png` | `bartek` | `#3D6B8C` bank | Czapka z daszkiem. |
| `avatars/nati.png` | `nati` | `#6B4F7A` campus | Kręcone włosy / koki. |
| `avatars/marek.png` | `marek` | `#3F7A6B` gym | Broda, starszy od reszty. |

Gdzie wejdzie: ekran setupu (wybór żetonu) oraz dwa kółka przy tytule w trakcie partii (Ty vs Kowalski). Kowalski dostaje jeden z tych czterech portretów, nigdy piątej twarzy.

---

## 6. P0: pionki (meeple / token na planszy)

**Wymiar:** `256 × 256`.  
**Kadr:** cała figura w środku, margines 10% pustki (alfa), żeby cień CSS nie ucinał stóp.  
**Tło:** wyłącznie alfa. Żadnego papierowego kwadratu.  
**Czytelnik:** na planszy ma **28 × 28 px**. To sylwetka, nie drugi portret.

Albo klasyczny meeple w kolorze żetonu, albo mały token-postawa z tym samym kodem koloru co portret. Cztery pliki, nie jeden rekolorowany: malujesz ubranie / kapelusz tak, by Ola i Marek nie myliły się przy 28 px.

| Plik | ID |
|---|---|
| `pawns/ola.png` | `ola` |
| `pawns/bartek.png` | `bartek` |
| `pawns/nati.png` | `nati` |
| `pawns/marek.png` | `marek` |

Animacja w grze: przesunięcie `transform` 280–400 ms między kafelkami, `prefers-reduced-motion: 0 ms`. Nie dostarczaj sprite’a chodu. Nie dostarczaj osobnych klatek „idzie w lewo / w prawo”: pionek nie obraca się.

Gdy oboje stoją na tym samym polu, CSS rozsuwa ich o pół szerokości. Sylwetka ma być czytelna też w półnakładce.

---

## 7. P0: ikony instalacji (PWA)

Te pliki nadpisują placeholdery w `public/`. Mogą być piktogramem tramwaju / pieczątki miasta, spójnym z resztą zestawu.

| Plik | Wymiar | Uwagi |
|---|---|---|
| `public/favicon.svg` | wektor, `viewBox 0 0 32 32` | Prostota, 1 motyw. SVG, nie PNG. |
| `public/icon-192.png` | `192 × 192` | `purpose: any`. Kwadrat, motyw w środku. |
| `public/icon-512.png` | `512 × 512` | **maskable**: trzymaj znak w kole 80% środka (bezpieczna strefa Android). Tło pełne, bez alfy na krawędzi. |
| `public/apple-touch-180.png` | `180 × 180` | Jak 192, iOS wytnie zaokrąglenie. |

Motyw: tramwaj albo pieczątka Mirkowa. Nie pisz tytułu gry na ikonie (system i tak doda „Mirków”).

---

## 8. P1: karty eventów

**Wymiar:** `768 × 1024` (3:4, pion).  
**Kadr:** ilustracja + puste dolne 28% albo czyste tło pod cytat. Gra i tak wyświetli podpis z i18n. Bezpieczniej: **zero tekstu**, podpis zawsze z kodu (łatwa zmiana copy).  
**Tło:** nieprzezroczyste.  
**Wejście w UI:** pasek / karta nad statusem po końcu tygodnia, nie pełny ekran. Na telefonie karta będzie `ok. 160 px` szerokości albo pasek `max-height ~ 140 px` z `object-fit: cover` od góry. Motyw trzymaj w górnej połowie.

Osiem stałych eventów z silnika. Bez wariantów.

| Plik | ID | Copy w grze (nie maluj tego) | Kadr |
|---|---|---|---|
| `events/korek.png` | `korek` | Korek na obwodnicy. | Estakada / obwodnica, stoi tramwaj albo rząd aut. |
| `events/lotto.png` | `lotto` | Kupon Szczęścia. | Zdrapka, nie logo Lotto. |
| `events/pralka.png` | `pralka` | Pralka padła. | Pralka, kałuża, na stancji. |
| `events/tesciowa.png` | `tesciowa` | Wizyta teściowej. | Gość w kapciach / ciasto, napięcie, bez karykatury realnej osoby. |
| `events/aukcje.png` | `aukcje` | Aukcje.pl. Impuls. | Telefon i paczka. Nie Allegro. |
| `events/kontrola.png` | `kontrola` | Kontrola w tramwaju. | Kabina tramwaju, bileter, mandat. |
| `events/pit.png` | `pit` | Pismo z urzędu. PIT. | Brązowa koperta, stempel, nie godło RP 1:1. |
| `events/promocja.png` | `promocja` | Promocja w Żuczku. | Koszyk, żółta markiza Żuczka. |

---

## 9. P1: ikony HUD (opcjonalnie)

**Wymiar:** `64 × 64`.  
**Tło:** alfa.  
**Kreska:** musi trzymać się przy `16–20 px` (tyle zajmuje etykieta).  
Jeśli nie malujesz HUD, zostają kropki i paski.

| Plik | Gdzie |
|---|---|
| `ui/stat-money.png` | Pieniądze |
| `ui/stat-happiness.png` | Szczęście |
| `ui/stat-education.png` | Wykształcenie |
| `ui/stat-career.png` | Kariera |
| `ui/need-food.png` | Jedzenie |
| `ui/need-clothes.png` | Ubranie |
| `ui/need-job.png` | Praca |
| `ui/time.png` | Czas (zamiast kropek albo obok podpisu) |

---

## 10. P1: mata i pieczątka

| Plik | Wymiar | Po co |
|---|---|---|
| `ui/board-mat.png` | `1600 × 1000` | Tło pod siatką 3×3 (papier, przetarcia, ślad tramwaju). CSS: `background-image` na `.board`, kafelki leżą na wierzchu. Bez nazw lokacji na macie. |
| `brand/stamp.png` | `256 × 256`, alfa | Zastępuje SVG pieczątki przy tytule. Ten sam motyw co favicon, większy detal. |

Tory między polami rysuje kod (podwójna szyna). Nie maluj torów na macie w miejscach, gdzie kod i tak je doda, albo maluj bardzo blado.

---

## 11. Animacje: co jest w grze, czego nie wysyłaj

| Ruch | Kto robi | Co dostarczasz |
|---|---|---|
| Przejazd pionka między polami | CSS `transform` 320 ms | 4 statyczne pionki |
| `prefers-reduced-motion` | CSS, 0 ms | nic |
| Naciśnięcie kafelka | CSS (`:active`) | statyczny kafelek |
| Wejście karty eventu | CSS opacity | statyczna karta |
| Chód, blink, idle, Lottie, MP4, GIF, sprite sheet | poza zakresem | nie wysyłaj |
| Cutscena końca tygodnia | nie istnieje | nie wysyłaj |
| Dźwięk | po grafikach | osobny brief |

Jeśli później zechcesz „żywy” pionek: jedna taśma `256 × 1024` (4 klatki `256 × 256` jedna pod drugą), 8 fps, pętla. Na teraz nie.

---

## 12. Jak podłączę to w kodzie

Nowa mapa w `src/ui/art.ts`:

- `tileArt(id: LocationId)` → `./art/tiles/${id}.png`
- `parkArt()` → `./art/tiles/park.png`
- `avatarArt(id: AvatarId)` → `./art/avatars/${id}.png`
- `pawnArt(id: AvatarId)` → `./art/pawns/${id}.png`
- `eventArt(id: EventId)` → `./art/events/${id}.png`

Kafelek: `img` albo `background-image` w `.tile-art`, nazwa i koszt zostają w DOM (dostępność, `aria-label` bez zmian).  
Portret: `img` w `.avatar-token` i `.face-chip`, `object-fit: cover`, kółko CSS.  
Pionek: `img` w `.pawn` zamiast SVG meeple, kolor z pliku, nie z `currentColor`.  
Event: `img` nad `.event`, ukrywane razem z tekstem gdy brak zdarzenia.  
Brak pliku: zostaje obecny SVG. Można wrzucać zestaw partiami (najpierw kafelki, potem twarze).

Service worker (`public/sw.js`) dostanie listę `./art/...` do precache, zmiana nazwy cache (`mirkow-v2`), żeby stara instalacja PWA dociągnęła grafiki.

Nie wpinam bitmap jako `import` z `src/` (to puchnie bundel). Zostają w `public/art/`.

---

## 13. Twarde zakazy

- Tekst, ceny, „2 cz.”, nazwy lokacji, logo gry na kafelkach i kartach.
- Logotypy: Biedronka, Żabka, McDonald’s, Allegro, Lotto, PKP, MPK, godło, flaga jako znak towarowy.
- Realne twarze, głębokiefake, znani politycy, znak Poznania / klubów.
- Wariant „dziecko” w żetonach. Postacie dorosłe.
- Osobne pliki `@2x` / `_dark`. Dark mode w CSS przekoloruje chrome, nie ilustracje. Maluj na jasny papier `#E8DCC8`.
- Font na bitmapie. Krój w grze to Outfit, self-host.

---

## 14. Paleta (opcjonalna, UI już jej używa)

| Token | Hex | Rola |
|---|---|---|
| paper | `#E8DCC8` | tło aplikacji |
| ink | `#2B2622` | tekst |
| road | `#4A5560` | tory |
| park | `#7A8F6A` | skwer |
| pup | `#C4B8A4` | PUP |
| shop | `#E2B84A` | Żuczek |
| kebab / accent | `#D4652F` | Nocna Buła, HUD |
| bank | `#3D6B8C` | kasa |
| campus | `#6B4F7A` | WSMiK |
| gym | `#3F7A6B` | siłka |
| cafe | `#A45C4A` | Na Rogu |
| home | `#8B6B4A` | stancja |

Możesz odejść od hexów, jeśli zestaw jest wewnętrznie spójny. Nie maluj neonu ani fioletowego glow.

---

## 15. Checklist eksportu (P0)

Razem **21 plików**:

```
art/tiles/pup.png
art/tiles/campus.png
art/tiles/bank.png
art/tiles/cafe.png
art/tiles/gym.png
art/tiles/home.png
art/tiles/shop.png
art/tiles/kebab.png
art/tiles/park.png
art/avatars/ola.png
art/avatars/bartek.png
art/avatars/nati.png
art/avatars/marek.png
art/pawns/ola.png
art/pawns/bartek.png
art/pawns/nati.png
art/pawns/marek.png
favicon.svg
icon-192.png
icon-512.png
apple-touch-180.png
```

P1, gdy P0 gra na planszy. **Stan 2026-09-05: komplet P0+P1 jest w `public/art/` i w grze.** Historyczna lista i wymiary zostają poniżej. Reszta specyfikacji P1: [brief-p1.md](brief-p1.md).

```
art/events/korek.png
art/events/lotto.png
art/events/pralka.png
art/events/tesciowa.png
art/events/aukcje.png
art/events/kontrola.png
art/events/pit.png
art/events/promocja.png
art/ui/stat-money.png
art/ui/stat-happiness.png
art/ui/stat-education.png
art/ui/stat-career.png
art/ui/need-food.png
art/ui/need-clothes.png
art/ui/need-job.png
art/ui/time.png
art/ui/board-mat.png
art/brand/stamp.png
```

Wrzucasz folder do projektu (albo dajesz paczkę zip o tej strukturze). Podłączam, sprawdzam na 390×844 i desktopie, czy napisy nie wchodzą w twarze i czy pionki czytają się na żółtym Żuczku i brązowej stancji.
