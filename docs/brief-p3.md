# Brief P3: grafiki do projektu „Głębia” (etapy G1–G4)

Data: 5 września 2026. Specyfikacja dla programu graficznego. Uzupełnia `brief-bitmapy.md` (P0), `brief-p1.md` i `brief-p2.md`. Mechanika, pod którą to powstaje: `projekt-glebia.md`.

Styl lock bez zmian: HD pixel / dither, ten sam ilustrator i ta sama pora dnia co `tiles/kebab.png`, `tiles/shop.png`, `avatars/ola.png`, `brand/panorama.png`. Papier `#E8DCC8`, tusz `#2B2622`, akcent `#D4652F`. Tło aplikacji jest ciemne (`#16120E`), kafelki są oświetlonymi oknami na ciemnym blacie.

**Twarde zasady (jak w P0):** zero tekstu, cyfr, logotypów i marek na bitmapie. PNG-24 sRGB 8 bit, alfa tam, gdzie zaznaczono. Nazwy plików małymi literami, myślniki, dokładnie jak w tabelach: kod mapuje ID 1:1 na nazwę. Bez `@2x`, bez wariantów `_dark`, bez sprite sheetów. Waga wg tabel.

Kod ma fallback na każdy brakujący plik (szary placeholder), więc paczki mogą przychodzić etapami. Kolejność poniżej to kolejność wdrożeń: **A i B są potrzebne do G1**, reszta do G2–G4.

---

## A. Trzy nowe kafelki lokacji (G1)

Wymiary i zasady identyczne jak 9 kafelków z P0: `512 × 384`, 4:3, nieprzezroczyste, dolne 32% kadru bez motywu (tam leży tabliczka z nazwą), motyw czytelny w miniaturze ok. 200 × 150 px, spójne światło i horyzont z resztą planszy. Waga < 130 KB.

| Plik | ID | Miejsce | Co narysować |
|---|---|---|---|
| `art/tiles/zajezdnia.png` | `zajezdnia` | Zajezdnia tramwajowa, rząd 1 kol. 4 | Hala zajezdni z otwartymi wrotami, w środku tramwaj (ten sam typ co na pieczątce i panoramie), kanał rewizyjny, lampa sodowa nad wjazdem. To fabryka Mirkowa: najlepsza praca w mieście. Kolor wiodący: ciemna zieleń wagonowa `#3F7A6B` z pomarańczem lampy. |
| `art/tiles/elektro.png` | `elektro` | Elektro-Mir, rząd 2 kol. 3 | Sklep RTV/AGD z lat 90.: witryna, w niej telewizor kineskopowy, lodówka, wieża. Neon wyłączony, żeby nie było „glow”. Bez napisu na szyldzie: pusty szyld albo piktogram wtyczki. Kolor wiodący: niebieski chłodny `#3D6B8C` z bielą sprzętów. |
| `art/tiles/lombard.png` | `lombard` | Lombard, rząd 3 kol. 3 | Wąska witryna z kratą, w środku rzeczy z drugiej ręki: rower, gitara, radio, garnitur na wieszaku, zegar. Znak lombardu jako trzy kule (motyw historyczny, bez liter). Kolor wiodący: brąz `#8B6B4A` z mosiądzem. |

Nowy układ planszy (desktop 4 × 3; na telefonie CSS przekłada to na 3 × 4, nie rysujesz drugiej wersji):

```
[PUP Mirków]  [WSMiK]     [Nasza Kasa]  [Zajezdnia]
[Na Rogu]     [Skwer]     [Elektro-Mir] [Siłka Rzeźba]
[Dom]         [Żuczek]    [Lombard]     [Nocna Buła]
```

## B. Ikony akcji (G1)

Jak `art/actions/*.png` z P2: `64 × 64`, alfa, gruba sylwetka czytelna w 24 px, kolor tusz i akcent, waga < 12 KB.

| Plik | Akcja | Motyw |
|---|---|---|
| `art/actions/work-shop.png` | Zmiana w Żuczku | skrzynka z warzywami / kasa sklepowa |
| `art/actions/work-bank.png` | Zmiana w Naszej Kasie | okienko kasowe z szybą / stempel |
| `art/actions/work-pup.png` | Zmiana w PUP | teczka z aktami |
| `art/actions/work-depot.png` | Zmiana w Zajezdni | klucz francuski i pantograf |
| `art/actions/apply.png` | Złóż podanie | podanie z pieczątką (bez liter) |
| `art/actions/raise.png` | Poproś o podwyżkę | dłoń z monetą / uścisk dłoni |
| `art/actions/suit.png` | Garnitur | marynarka na wieszaku (inna niż `buy-clothes.png`) |

Istniejący `work-kebab.png` zostaje dla Nocnej Buły.

## C. Ikony HUD: praca i koniunktura (G1)

`64 × 64`, alfa, jak `art/ui/*.png`.

| Plik | Gdzie | Motyw |
|---|---|---|
| `art/ui/reliability.png` | pasek „Solidność” przy pracy | karta zegarowa / stempel obecności |
| `art/ui/experience.png` | „Staż” przy pracy | szewrony na rękawie / kalendarz |
| `art/ui/boom.png` | pieczątka koniunktury w pasku górnym | strzałka w górę w kole, styl pieczątki jak `brand/stamp.png` |
| `art/ui/recession.png` | pieczątka koniunktury | strzałka w dół w kole, ten sam styl |

## D. Karty zdarzeń (G1–G4)

Jak `art/events/*.png`: `768 × 1024`, 3:4, nieprzezroczyste, motyw w górnych 55%, dół czysty papier pod tytuł i efekt. Waga < 180 KB. Zero tekstu.

| Plik | Etap | Copy w grze (nie maluj) | Kadr |
|---|---|---|---|
| `art/events/zwolnienie.png` | G1 | Zwolnienie | Karton z rzeczami z biurka, kubek, kaktus, drzwi za plecami. |
| `art/events/redukcja.png` | G1 | Redukcja etatów | Tablica ogłoszeń z jedną kartką (bez liter), pusta hala, zgaszone światła. |
| `art/events/podwyzka.png` | G1 | Podwyżka | Koperta z gotówką na biurku, uścisk dłoni w tle. |
| `art/events/awans.png` | G1 | Awans | Nowa plakietka na drzwiach (pusta), klucze. |
| `art/events/oblany-egzamin.png` | G2 | Oblany egzamin | Ławka egzaminacyjna, przekreślony arkusz (kreska, nie litery), zegar. |
| `art/events/dyplom.png` | G2 | Dyplom | Rulon z pieczęcią i wstążką, bez orła i liter. |
| `art/events/zdzichu.png` | G3 | Zdzichu z klatki | Otwarte drzwi stancji, wyrwany kabel po telewizorze, ślady butów. |
| `art/events/kieszonkowiec.png` | G4 | Kieszonkowiec | Tłok w tramwaju, ręka przy cudzej kieszeni. |
| `art/events/komornik.png` | G4 | Komornik | Człowiek w płaszczu z teczką i naklejką na lodówce (naklejka bez liter). |
| `art/events/przeprowadzka.png` | G3 | Przeprowadzka | Kartony na klatce, klucze na sznurku. |

## E. Dom w trzech wersjach (G3)

Kafelek „Dom” zmienia się z mieszkaniem. Istniejący `tiles/home.png` to stancja (Pokój u Krysi). Dwa kolejne kafelki `512 × 384`, ten sam kadr i światło:

| Plik | Mieszkanie | Co narysować |
|---|---|---|
| `art/tiles/home-kawalerka.png` | Kawalerka w bloku | Fragment bloku z wielkiej płyty, jedno okno z firanką i lampą, balkon z rowerem. Brąz i szarość betonu, ciepłe światło w oknie. |
| `art/tiles/home-apartament.png` | Mieszkanie nad Skwerem | Odnowiona kamienica, duże okno z widokiem na drzewa Skweru, roślina na parapecie. Beż i zieleń. |

## F. Wnętrza mieszkań (G3)

Tło panelu „Dom”, na którym kod układa przedmioty. `1024 × 576` (16:9), nieprzezroczyste. Waga < 300 KB. Jedno ujęcie pokoju od ściany, **z pustymi półkami i pustą podłogą** w wyznaczonych strefach. Kod przypina sprite’y przedmiotów do stałych punktów, więc strefy muszą być puste na wszystkich trzech kadrach:

- strefa A (duży sprzęt: lodówka, pralka, kanapa): lewa dolna ćwiartka, podłoga,
- strefa B (RTV: telewizor, wieża, komputer): środek, na wysokości stołu,
- strefa C (małe: encyklopedia, rower, garnitur): prawa strona, półka i wieszak.

| Plik | Wnętrze |
|---|---|
| `art/rooms/stancja.png` | Pokój u Krysi: tapczan, tapeta w kwiaty, kaloryfer, jedno okno, sznur z praniem za oknem. Ciasno. |
| `art/rooms/kawalerka.png` | Kawalerka: meblościanka, wykładzina, większe okno, balkon. Więcej miejsca na półkach. |
| `art/rooms/apartament.png` | Mieszkanie nad Skwerem: parkiet, wysokie okna, sztukateria, regał na całą ścianę. |

## G. Przedmioty, sprite’y do wnętrza (G3)

`256 × 256`, alfa, obiekt w środku z marginesem 10%, **ten sam kąt widzenia co wnętrza** (lekko z góry, od frontu). W grze mają ok. 96 px na desktopie i 64 px na telefonie. Waga < 30 KB.

| Plik | Przedmiot | Strefa |
|---|---|---|
| `art/items/lodowka.png` | lodówka, biała, z magnesem | A |
| `art/items/pralka.png` | pralka frontowa | A |
| `art/items/kanapa.png` | kanapa w kratę | A |
| `art/items/telewizor.png` | telewizor kineskopowy na szafce | B |
| `art/items/wieza.png` | wieża hi-fi z kolumnami | B |
| `art/items/komputer.png` | komputer z monitorem CRT | B |
| `art/items/encyklopedia.png` | rząd tomów na półce | C |
| `art/items/rower.png` | rower miejski oparty o ścianę | C |
| `art/items/garnitur.png` | garnitur na wieszaku | C |

Do każdego przedmiotu wariant **zepsuty** nie jest potrzebny: kod nakłada ikonę klucza (`art/ui/broken.png`, `64 × 64`, alfa: klucz francuski przekreślony).

## H. Ikony akcji (G3–G4)

`64 × 64`, alfa, jak wyżej.

| Plik | Akcja |
|---|---|
| `art/actions/move.png` | Przeprowadzka: kartony |
| `art/actions/buy-item.png` | Kup sprzęt: pudło ze wstążką |
| `art/actions/sell.png` | Sprzedaj w lombardzie: trzy kule lombardu |
| `art/actions/repair.png` | Naprawa: klucz francuski |
| `art/actions/exam.png` | Egzamin: arkusz i ołówek |
| `art/actions/eat.png` | Zjedz na miejscu: kebab na talerzu |
| `art/actions/account.png` | Konto: książeczka oszczędnościowa |
| `art/actions/loan.png` | Kredyt: umowa z podpisem (kreska) |
| `art/actions/stocks.png` | Akcje: wykres łamany bez cyfr |

## I. Dyplomy (G2)

`128 × 128`, alfa. Rulon z pieczęcią w kolorze kierunku, bez liter. Wyświetlane w liście WSMiK i w HUD (32 px).

| Plik | Kolor pieczęci |
|---|---|
| `art/diplomas/kurs.png` | pomarańcz `#D4652F` |
| `art/diplomas/matura.png` | zieleń `#7A8F6A` |
| `art/diplomas/zarzadzanie.png` | żółć `#E2B84A` |
| `art/diplomas/ekonomia.png` | granat `#3D6B8C` |
| `art/diplomas/administracja.png` | beż `#C4B8A4` |
| `art/diplomas/inzynieria.png` | zieleń wagonowa `#3F7A6B` |
| `art/diplomas/magister.png` | fiolet `#6B4F7A` |

---

## Czego nie malować

Walk cycle, blink, Lottie, sprite sheet, dźwięk, pory dnia, wersje `@2x`, warianty ciemne. Portrety pracowników w firmach (Jones miał aktorów) na razie nie: tabliczki z nazwami wystarczają.

## Checklist paczek

**Paczka G1 (minimum, 14 plików):**
```
art/tiles/zajezdnia.png
art/tiles/elektro.png
art/tiles/lombard.png
art/actions/work-shop.png
art/actions/work-bank.png
art/actions/work-pup.png
art/actions/work-depot.png
art/actions/apply.png
art/actions/raise.png
art/actions/suit.png
art/ui/reliability.png
art/ui/experience.png
art/ui/boom.png
art/ui/recession.png
```

**Paczka G1 karty (4 pliki):** `events/zwolnienie.png`, `events/redukcja.png`, `events/podwyzka.png`, `events/awans.png`.

**Paczka G2 (9 plików):** 7 dyplomów, `events/oblany-egzamin.png`, `events/dyplom.png`, `actions/exam.png`.

**Paczka G3 (18 plików):** 2 kafelki domu, 3 wnętrza, 9 przedmiotów, `ui/broken.png`, `events/zdzichu.png`, `events/przeprowadzka.png`, `actions/move.png`, `actions/buy-item.png`, `actions/sell.png`, `actions/repair.png`.

**Paczka G4 (6 plików):** `events/kieszonkowiec.png`, `events/komornik.png`, `actions/eat.png`, `actions/account.png`, `actions/loan.png`, `actions/stocks.png`.

Na końcu wypisz wymiary każdego pliku w pikselach, jak przy P1.
