# Brief P4: postacie Mirkowa i grafiki „zachęty” (po audycie UX)

> **Dostarczone 5 września 2026:** paczki P4-A (11 postaci + ikona lokaty) i P4-B (2 miny Kowalskiego), wpięte w grę. Poprawka P4b tego samego dnia: alfa we wszystkich plikach, trener odrzucony (zdjęcie z logo), patrz `uwagi-p4b.md`. P4-C (winiety weekendów, karta instrukcji) nadal otwarte, opcjonalne.

Data: 5 września 2026. Specyfikacja dla programu graficznego. Uzupełnia `brief-bitmapy.md` (P0), `brief-p1.md`, `brief-p2.md` i `brief-p3.md`. Powód i kontekst: `audyt-ux-2026-09-05.md`, §6 i §9. Krótko: Jones w każdym budynku miał człowieka, który coś mówił, a Mirków ma puste kadry. Ta paczka dodaje miastu ludzi.

Styl lock bez zmian: HD pixel / dither, ten sam ilustrator, ta sama pora dnia i to samo światło co `avatars/ola.png`, `avatars/kowalski.png`, `tiles/kebab.png`, `brand/panorama.png`. Papier `#E8DCC8`, tusz `#2B2622`, akcent `#D4652F`. Tło aplikacji ciemne (`#16120E`): popiersia będą stały na ciemnym panelu obok kadru lokacji, więc kontur musi trzymać się na ciemnym tle (jasna krawędź, żadnych ciemnych włosów bez obrysu).

**Twarde zasady (jak w P0):** zero tekstu, cyfr, logotypów, marek i realnych twarzy na bitmapie. PNG-24 sRGB 8 bit, alfa tam, gdzie zaznaczono. Nazwy plików małymi literami, myślniki, dokładnie jak w tabelach: kod mapuje ID 1:1 na nazwę. Bez `@2x`, bez wariantów `_dark`, bez sprite sheetów. Waga wg tabel.

Kod ma fallback na każdy brakujący plik, więc paczki mogą przychodzić etapami. Kolejność poniżej to kolejność wdrożeń: **A jest potrzebne do „prowadzenia gracza” (krok 4 z audytu)**, B i C do karty Kowalskiego, D i E są opcjonalne.

---

## A. Postacie Mirkowa, 11 popiersi (priorytet)

Format identyczny z portretami graczy w `art/avatars/`: `512 × 512`, alfa, popiersie od pasa w górę, twarz zwrócona lekko w lewo (w stronę kadru lokacji, który stoi po lewej w panelu), głowa w górnych 60% kadru, margines 6% od krawędzi. W grze pokazywane w 128 px na desktopie i 80 px na telefonie, więc rysy muszą czytać się w miniaturze: wyraźna sylwetka, jeden rekwizyt, jeden kolor wiodący zgodny z kafelkiem miejsca. Waga < 60 KB.

Każda postać jest mieszkańcem Mirkowa z lat 90./2000., bez karykatury i bez stereotypów wyglądu. Wiek i nastrój w tabeli są wskazówką do miny, nie do przerysowania. Ubranie z epoki, bez logo.

| Plik | Miejsce (kafelek) | Postać | Rekwizyt i kolor wiodący | Nastrój |
|---|---|---|---|---|
| `art/npc/krysia.png` | Pokój u Krysi (`tiles/home.png`) | Krysia, gospodyni stancji, ok. 65 lat, fartuch w kwiaty, lokówki albo chusta | ścierka przez ramię, w ręku talerz z ciastem; kolor: róż tapety `#B8788A` | podejrzliwa, ale życzliwa |
| `art/npc/urzedniczka.png` | PUP Mirków | urzędniczka, ok. 45 lat, sweter, okulary na łańcuszku | pieczątka i teczka; kolor: szarość biurowa `#8C8C86` z pomarańczem tuszu | znudzona, patrzy znad okularów |
| `art/npc/wykladowca.png` | WSMiK | wykładowca, ok. 55 lat, sztruksowa marynarka, broda | kreda i gruba książka; kolor: zieleń tablicy `#3F6B5A` | rozkojarzony entuzjasta |
| `art/npc/kasjerka-banku.png` | Nasza Kasa | kasjerka, ok. 30 lat, apaszka, elegancka bluzka | liczydło albo kalkulator z rolką papieru, szyba okienka za nią; kolor: granat `#3D6B8C` | uprzejma, chłodna |
| `art/npc/brygadzista.png` | Zajezdnia | brygadzista, ok. 50 lat, kombinezon, kask pod pachą | klucz francuski, wąs; kolor: zieleń wagonowa `#3F7A6B` | konkretny, lekko zmęczony |
| `art/npc/sprzedawczyni.png` | Żuczek | sprzedawczyni, ok. 40 lat, fartuch sklepowy, plakietka bez liter | skrzynka jabłek albo skaner cenowy; kolor: żółć Żuczka `#E2B84A` | szybka, zagadana |
| `art/npc/lombardzista.png` | Lombard | lombardzista, ok. 60 lat, kamizelka, lupa jubilerska na czole | zegarek kieszonkowy na łańcuszku; kolor: brąz `#8B6B4A` z mosiądzem | cwany, ocenia wzrokiem |
| `art/npc/kebabiarz.png` | Nocna Buła | kebabiarz, ok. 35 lat, czapka kucharska albo bandana, T-shirt | nóż do kebaba i rożen w tle; kolor: czerwień neonu `#C8453A` | serdeczny, w gorącu |
| `art/npc/elektryk.png` | Elektro-Mir | sprzedawca RTV, ok. 28 lat, koszula w kratę, krawat | pilot do telewizora, za nim ściana kineskopów; kolor: niebieski chłodny `#3D6B8C` z bielą | nadgorliwy sprzedawca |
| `art/npc/barista.png` | Na Rogu | barista, ok. 25 lat, fartuch, kolczyk, włosy związane | filiżanka na spodku, ekspres w tle; kolor: brąz kawy `#6B4A32` z kremem | spokojny, wyspany |
| `art/npc/trener.png` | Siłka Rzeźba | trener, ok. 40 lat, dres, ręcznik na karku | hantel i gwizdek; kolor: pomarańcz `#D4652F` | głośny, motywujący |

Bez postaci dla Skweru (dekoracja).

Do każdej postaci kod dobiera jedną kwestię z puli w `pl.ts`, zależną od stanu gry (np. Krysia komentuje czynsz, urzędniczka staż). Kwestia jest tekstem w interfejsie, **nie na bitmapie**, i nie ma dymka na grafice: dymek rysuje CSS.

## B. Kowalski, miny (karta jego tury)

Jak `avatars/kowalski.png`: `512 × 512`, alfa, **dokładnie ten sam kadr, strój i oświetlenie**, zmienia się tylko mina i ewentualnie gest dłoni. Waga < 60 KB.

| Plik | Kiedy pokazywane | Mina |
|---|---|---|
| `art/avatars/kowalski-zadowolony.png` | awans, podwyżka, dyplom, wygrana Kowalskiego | szeroki uśmiech, uniesiony kciuk |
| `art/avatars/kowalski-wkurzony.png` | zwolnienie, oblany egzamin, Zdzichu, komornik | zmarszczone brwi, zaciśnięte usta, ręka na czole |

Istniejący `kowalski.png` zostaje jako mina neutralna.

## C. Ikona lokaty

Jak `art/actions/*.png`: `64 × 64`, alfa, gruba sylwetka czytelna w 24 px, kolor tusz i akcent, waga < 12 KB.

| Plik | Akcja | Motyw |
|---|---|---|
| `art/actions/deposit.png` | Lokata na 4 tygodnie | słoik z monetami i gumką na wieczku (inny niż książeczka z `account.png`) |

## D. Winiety weekendów (opcjonalnie)

Pasek weekendu na dole karty zdarzenia. `512 × 256` (2:1), alfa, scena pozioma bez ludzi z rozpoznawalną twarzą (sylwetki OK), motyw w lewych 60% kadru, prawa strona lżejsza, bo tam kod kładzie tekst linijki. Waga < 60 KB.

Sześć winiet pokrywa 22 linijki weekendów według kategorii:

| Plik | Linijki z gry (copy w `pl.ts`, nie maluj) | Kadr |
|---|---|---|
| `art/weekends/spokoj.png` | spacer po Skwerze, kawa na balkonie, widok na Skwer, weekend na kanapie | ławka na Skwerze, gołębie, liście |
| `art/weekends/impreza.png` | piwo z Kowalskim, impreza przy pustej lodówce, goście w mieszkaniu, grill z sąsiadami | stół z butelkami i miską chipsów, girlanda żarówek |
| `art/weekends/deszcz.png` | lało cały weekend, awantura Krysi o łazienkę | okno z kroplami, parapet, mokre podwórko |
| `art/weekends/wycieczka.png` | rowerem nad jezioro, kino na Rogu | rower oparty o drzewo, jezioro, koc |
| `art/weekends/dom.png` | maraton seriali, nowa płyta, granie do nocy, quiz z encyklopedią, ciasto od Krysi | kanapa, koc, ekran świecący w ciemnym pokoju |
| `art/weekends/kasa.png` | fucha na komputerze, pranie sąsiadki, abonament, zakupy impulsowe, zrzutka na tort | portfel i kilka monet na stole, paragon (bez cyfr) |

## E. Karta „Jak się gra” (opcjonalnie)

Tło jednorazowej karty startowej z czterema zdaniami zasad. Jak `art/events/*.png`: `768 × 1024`, 3:4, nieprzezroczyste, motyw w górnych 45%, dół czysty papier pod tekst. Waga < 180 KB.

| Plik | Kadr |
|---|---|
| `art/brand/instrukcja.png` | Rozłożona na stole papierowa mapa Mirkowa (ten sam układ 4×3 co plansza, kafelki jako plamki koloru bez nazw), na niej pionek, bilet tramwajowy i kubek kawy. Jak instrukcja z pudełka gry planszowej. |

---

## Czego nie malować

Dymków z tekstem, mimiki w kilku klatkach, sylwetek całych postaci, tła za popiersiem (tło daje panel), wersji `@2x`, wariantów ciemnych, sprite sheetów. Postaci dla graczy (mamy 5 awatarów) ani nowych awatarów.

## Checklist paczek

**Paczka P4-A (minimum, 12 plików):**
```
art/npc/krysia.png
art/npc/urzedniczka.png
art/npc/wykladowca.png
art/npc/kasjerka-banku.png
art/npc/brygadzista.png
art/npc/sprzedawczyni.png
art/npc/lombardzista.png
art/npc/kebabiarz.png
art/npc/elektryk.png
art/npc/barista.png
art/npc/trener.png
art/actions/deposit.png
```

**Paczka P4-B (2 pliki):** `avatars/kowalski-zadowolony.png`, `avatars/kowalski-wkurzony.png`.

**Paczka P4-C, opcjonalna (7 plików):** 6 winiet `weekends/*.png`, `brand/instrukcja.png`.

Na końcu wypisz wymiary każdego pliku w pikselach, jak przy P1.
