# Brief P2: grafiki, które podniosą grę po redesignie E1–E2

**Dostarczone i wpięte 2026-09-05 (komplet 18 plików).** Plik zostaje jako specyfikacja.

Stan 2026-09-05 po wdrożeniu etapów E1 (fundament wizualny) i E2 (moment gry). Wszystko, co jest w grze, działa na obecnych bitmapach. Poniżej lista rzeczy, których **nie da się** zrobić w CSS, a które zmienią odbiór. Kolejność według wpływu.

Styl lock bez zmian: HD pixel / dither, ten sam ilustrator co `tiles/kebab.png` i `avatars/ola.png`, papier `#E8DCC8`, tusz `#2B2622`, akcent `#D4652F`. **Zero tekstu, cyfr i logotypów na bitmapach.** Format PNG-24 sRGB (WebP zrobimy w buildzie). Nazwy plików małymi literami, dokładnie jak niżej.

Kontekst wizualny gry po E1: tło aplikacji jest ciemne (`#16120E`), kafelki są „oświetlonymi oknami” na ciemnym blacie, tekst leży na papierowych tabliczkach. Nowe kadry mają pasować do tego wieczoru.

---

## 1. Panorama Mirkowa na ekran startu (najwyższy priorytet)

| Pole | Wartość |
|---|---|
| Plik | `art/brand/panorama.png` |
| Wymiar | `1920 × 1080` (16:9) |
| Tło | nieprzezroczyste |
| Waga | < 600 KB |

Kadr: Mirków o zmierzchu z poziomu ulicy albo z lekkiej góry. W jednym ujęciu: tramwaj na estakadzie (jak na karcie korka), kamienica ze sznurem prania, żółta markiza Żuczka, okienko Nocnej Buły z parą, wieżyczka banku w tle. Lampy uliczne już zapalone, niebo jak na `events/korek.png`. **Prawa 40% kadru spokojniejsza** (niebo, dachy, mniej detalu), bo tam leży tytuł i przyciski. Dolne 15% może być ulicą bez obiektów.

Gdzie wejdzie: tło ekranu startu, przyciemnione do ok. 55%, a na telefonie przycięte do środka.

## 2. Kowalski: własna twarz i pionek

Dziś bot dostaje jeden z czterech portretów graczy, więc „Kowalski” wygląda jak Bartek. Rywal zasługuje na własną gębę.

| Plik | Wymiar | Uwagi |
|---|---|---|
| `art/avatars/kowalski.png` | `512 × 512` | ten sam kadr co pozostałe portrety: popiersie, głowa w środku. Mężczyzna 40+, wąs albo zarost, kurtka z lat 90., mina „wiem lepiej”. Kolor ubrania: szarość z nutą papieru `#C4B8A4` (kolor PUP), nie kolor żadnego z graczy. |
| `art/pawns/kowalski.png` | `256 × 256`, alfa | jak pozostałe pionki, monochrom w tym samym szarym. Ma się różnić sylwetką od czterech istniejących (np. teczka pod pachą). |

Gdzie wejdzie: pionek na planszy, kółko w pasku górnym, ekran zwycięstwa gdy Kowalski wygra.

## 3. Ikony akcji (11 sztuk)

Wiersz akcji w panelu ma dziś tylko tekst. Ikona przed nazwą sprawi, że lista czyta się jak menu w grze, nie jak formularz.

| Pole | Wartość |
|---|---|
| Folder | `art/actions/` |
| Wymiar | `64 × 64`, alfa |
| Kreska | jak `art/ui/*.png` (te same ikony HUD są wzorcem), czytelne w 24 px |
| Waga | < 12 KB każda |

| Plik | Akcja | Motyw |
|---|---|---|
| `search-job.png` | Szukaj pracy | numerek z kolejki / okienko urzędu |
| `apply-kierownik.png` | Awans na kierownika | pęk kluczy |
| `open-lokal.png` | Własny lokal | szyld bez liter, okienko z kebabem |
| `work-kebab.png` | Zmiana | nóż do kebaba / rożen |
| `study-course.png` | Kurs weekendowy | zeszyt i długopis |
| `study-degree.png` | Zaliczenie | indeks / dyplom bez orła |
| `buy-food.png` | Jedzenie | siatka z zakupami |
| `buy-clothes.png` | Ciuchy | sweter na wieszaku |
| `rest-home.png` | Drzemka | poduszka |
| `rest-cafe.png` | Kawka | filiżanka z parą |
| `rest-gym.png` | Trening | hantel |

## 4. Mata planszy w wersji ciemnej

Obecna `art/ui/board-mat.png` to jasny kraft. Na ciemnym blacie używamy jej z filtrem, co działa, ale ciemna wersja od ilustratora będzie ładniejsza.

| Pole | Wartość |
|---|---|
| Plik | `art/ui/board-mat-dark.png` |
| Wymiar | `1600 × 1000` |
| Treść | ciemny stół (stare drewno albo ciemna tektura), przetarcia, bardzo blady ślad szyn, ślad po kubku. Ton bliski `#221C17`. Bez nazw i bez torów w miejscach siatki 3×3 (tory rysuje kod). |
| Waga | < 250 KB |

## 5. Dwie karty eventów na E3 (balans)

Do etapu E3 planuję dwa nieujemne zdarzenia, żeby gra nie karała w każdej turze. Karty w formacie jak `events/*.png`.

| Plik | Wymiar | Kadr |
|---|---|---|
| `art/events/napiwki.png` | `768 × 1024` | Słoik na napiwki przy okienku Nocnej Buły, kilka banknotów, wieczór. Motyw w górnych 55%, dół papier. |
| `art/events/spokoj.png` | `768 × 1024` | Spokojny tydzień: pusty przystanek, ławka, kot na murku, deszcz przestał padać. Motyw w górnych 55%. |

## 6. Drobiazgi (opcjonalne)

- `art/tiles/pup.png`: czerwony prostokąt w okienku wygląda jak placeholder. Zamienić na wyświetlacz z numerkiem bez cyfr (np. pusta czerwona dioda), albo na blaszaną tabliczkę.
- `art/brand/stamp-win.png` `256 × 256`, alfa: wariant pieczątki tramwaju z laurowym wieńcem, na ekran zwycięstwa. Dziś jest napis CSS na ramce, działa, ale bitmapa będzie lepsza.

---

## Czego nadal nie robić

Walk cycle, blink, Lottie, sprite sheet, dźwięk, pory dnia na kafelkach, dodatkowe lokacje. Silnik tego nie ma i E1–E4 tego nie potrzebują.

## Checklist zip

```
art/brand/panorama.png
art/avatars/kowalski.png
art/pawns/kowalski.png
art/actions/search-job.png
art/actions/apply-kierownik.png
art/actions/open-lokal.png
art/actions/work-kebab.png
art/actions/study-course.png
art/actions/study-degree.png
art/actions/buy-food.png
art/actions/buy-clothes.png
art/actions/rest-home.png
art/actions/rest-cafe.png
art/actions/rest-gym.png
art/ui/board-mat-dark.png
art/events/napiwki.png
art/events/spokoj.png
```

Minimum, żeby było widać różnicę od razu: panorama (1) i Kowalski (2). Reszta może dojść kolejną paczką.
