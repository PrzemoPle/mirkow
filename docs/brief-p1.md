# P1: czego brakuje (parametry pod program graficzny)

**Stan 2026-09-05:** paczka dostarczona i wpięta. Ten plik zostaje jako specyfikacja produkcji, nie jako lista braków.

P0 jest w grze. **Nie przerabiaj** kafelków, portretów, pionków, korku, pieczątki ani ikon PWA.

Styl lock: HD pixel / dither, Mirków, papier `#E8DCC8`, tusz `#2B2622`, akcent `#D4652F`. Wzorzec karty: `public/art/events/korek.png` (768×1024). Wzorzec lokalu Żuczek: `public/art/tiles/shop.png`.

Razem do zrobienia: **7 kart + 8 ikon HUD + 1 mata = 16 plików**. HUD i mata są opcjonalne. Karty eventów są obowiązkowe.

---

## Format wspólny

| Pole | Wartość |
|---|---|
| Format | PNG-24, sRGB, 8 bit |
| Nazwy | małe litery, dokładnie jak niżej |
| Tekst na bitmapie | **zero** (copy dokłada CSS) |
| Logotypy | zakaz: Lotto, Allegro, Biedronka, MPK, godło RP |
| @2x / dark / GIF / Lottie | nie |
| Paczka | zip o strukturze `art/events/…`, `art/ui/…` |

---

## A. Karty eventów (obowiązkowe) — 7 plików

**Płótno:** `768 × 1024 px` (pion 3:4).  
**Tło:** nieprzezroczyste.  
**Kadr:** motyw w **górnych 55%** (ok. 0–563 px). Dół może być papierem / grunt, ale bez ramki UI i bez napisów.

**Jak gra pokazuje:** miniatura `70 × 93 px` (`4.4rem × 5.8rem`), `object-fit: cover`, `object-position: center top`. Na telefonie widać górę kadru. Czytelność motywu w 70 px szerokości.

**Waga:** każdy plik **< 180 KB**.

| Plik | ID silnika | Efekt (nie maluj cyfr) | Kadr |
|---|---|---|---|
| `art/events/lotto.png` | `lotto` | +400 zł | Zdrapka **Kupon Szczęścia**. Nie logo Totalizatora / Lotto. |
| `art/events/pralka.png` | `pralka` | −180 zł | Pralka na stancji, kałuża, kabel. Ten sam klimat co `tiles/home.png`. |
| `art/events/tesciowa.png` | `tesciowa` | −8 szczęścia | Wizyta: kapcie, ciasto, napięcie. Dorosła fikcyjna osoba, bez karykatury znanej twarzy. |
| `art/events/aukcje.png` | `aukcje` | −90 zł | Telefon i paczka, impuls zakupowy. Napis **Aukcje.pl** też nie: zero liter. Nie Allegro. |
| `art/events/kontrola.png` | `kontrola` | −50 zł | Kabina tramwaju, bileter, mandat. Tramwaj jak na pieczątce, nie MPK. |
| `art/events/pit.png` | `pit` | −220 zł | Brązowa koperta, stempel urzędu. Nie godło RP 1:1, nie konkretny urząd skarbowy. |
| `art/events/promocja.png` | `promocja` | +1 tydzień jedzenia | Koszyk, żółta markiza, żuk. Spójne z `tiles/shop.png`. Nie Biedronka. |

`art/events/korek.png` **już jest**. Nie wysyłaj duplikatu, chyba że poprawiasz wagę / kadr do tych samych 768×1024.

Kolejność w silniku (losowanie): korek, lotto, pralka, tesciowa, aukcje, kontrola, pit, promocja.

---

## B. Ikony HUD (opcjonalne) — 8 plików

**Płótno:** `64 × 64 px`.  
**Tło:** wyłącznie alfa.  
**Motyw:** 1 przedmiot, gruba sylwetka. Musi czytać się w **20 × 20 px**.  
**Waga:** każdy **< 12 KB**.  
**Kolor:** tusz / akcent, bez neonu.

Gra pokazuje etykietę 0.8 rem obok. Ikona wejdzie w lewo od podpisu.

| Plik | Etykieta w grze | Motyw |
|---|---|---|
| `art/ui/stat-money.png` | Pieniądze | banknot / moneta, nie znak zł |
| `art/ui/stat-happiness.png` | Szczęście | kawa / ławka, nie emotikon |
| `art/ui/stat-education.png` | Wykształcenie | zeszyt / dyplom bez orła |
| `art/ui/stat-career.png` | Kariera | fartuch / klucze Nocnej Buli |
| `art/ui/need-food.png` | Jedzenie | buła / kebab |
| `art/ui/need-clothes.png` | Ubranie | koszula na wieszaku |
| `art/ui/need-job.png` | Praca | czapka kasjera / okienko |
| `art/ui/time.png` | Czas | zegar tramwajowy / dziurkacz biletów |

---

## C. Mata planszy (opcjonalna) — 1 plik

| Pole | Wartość |
|---|---|
| Plik | `art/ui/board-mat.png` |
| Płótno | `1600 × 1000 px` |
| Tło | nieprzezroczyste, papier kraft |
| Treść | przetarcia, ślad szyn bardzo blady |
| Zakaz | nazwy lokacji, tory w miejscach siatki 3×3 (kod i tak rysuje szyny) |
| W grze | `background-image` pod kafelkami; desktop ok. 667×335, telefon ok. 363×279 |
| Waga | **< 250 KB** |

Pieczątka `art/brand/stamp.png` **już jest**.

---

## D. Czego nie malować

- kafelki, awatary, pionki, favicon, icon-192/512, apple-touch-180
- chód, blink, Lottie, MP4, sprite sheet
- ekran zwycięstwa, splash, pory dnia
- czynsz, głód, MOPS, ciocia (to sam tekst)

Animacja karty: CSS opacity. Dostarczasz klatkę nieruchomą.

---

## E. Checklist zip

```
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
```

Minimum, żebym wpiął od razu: **siedem kart z sekcji A**. HUD i mata mogą dojść następną paczką.

Na końcu wypisz wymiary każdego pliku w pikselach (ma być 1:1 z tabelą).
