# Brief P7: co domówić przez SpriteCook

Data: 11 września 2026. Powstał po teście narzędzia SpriteCook na trzech ikonach. Uzupełnia `brief-p6.md`, który nigdy nie został dostarczony przez człowieka, i zastępuje go tam, gdzie SpriteCook wystarczy.

## Co już wiemy z testu

Wygenerowałem trzy ikony modelem `gpt-image-2.5-flare`, z dwiema naszymi ikonami jako wzorcem stylu (`style_asset_ids`). Wynik: **jedna z trzech nadawała się od razu**.

| Próba | Wynik | Dlaczego |
|---|---|---|
| radio tranzystorowe | wzięte do gry jako `ui/music.png` | gruby kontur, nasza paleta, czyta się przy 32 px |
| filiżanka kawy | odrzucona | zbyt cienki kontur, ginie przy 32 px |
| dzwonek tramwajowy | odrzucony | czyta się jak klosz do potraw, nie jak dzwonek |

**Co narzędzie robi dobrze:** trafia paletę, gdy poda się nasze pliki jako wzorzec, i zwraca **prawdziwą alfę** (44–52% przezroczystych pikseli, czysty róg). To jest różnica wobec paczek P4 i P4b, gdzie alfy nie było wcale i trzeba było ręcznie zdejmować obwódkę.

**Czego nie robi:** nie trzyma grubości konturu i nie zawsze trafia w temat. Rozmiar wyjścia jest za każdym razem inny (40, 94, 126 px przy tym samym żądaniu 64), więc każdy plik wymaga u nas dopasowania do 64 × 64 ze stałym marginesem.

**Wniosek:** SpriteCook nadaje się do **ikon i pojedynczych rekwizytów**, pod warunkiem odrzucania słabych prób. Nie nadaje się bez nadzoru do portretów i kadrów lokacji, gdzie jedna nieudana próba psuje spójność całej planszy.

## Zasady pracy z narzędziem

1. Model `gpt-image-2.5-flare`, `pixel=true`, `bg_mode="transparent"`. To jeden z dwóch modeli z prawdziwą przezroczystością; reszta wymagałaby osobnego usuwania tła.
2. Zawsze podawać `style_asset_ids` z `spritecook-assets.json`. Bez wzorca paleta odjeżdża.
3. W opisie stylu zawsze: gruby ciemny kontur, kremowy papier i przypalony pomarańcz, płaskie cieniowanie, **zero tekstu, liter i cyfr**.
4. Generować po 2–3 warianty na ikonę i odrzucać wszystko, co nie czyta się przy 32 px. Liczyć się z odrzuceniem połowy.
5. Każdy plik dopasować do 64 × 64 z marginesem, zanim trafi do `art-src/`.
6. Koszt: 8 kredytów za obraz plus 8 za każdy wzorzec. Przy dwóch wzorcach to 24 kredyty za próbę.

## Kolejka do wygenerowania

### A. Ikony, które są dziś słabe albo dublują znaczenie

| Plik | Co jest nie tak | Co zamówić |
|---|---|---|
| `ui/reliability.png` | ciemna skrzynka bez czytelnego motywu, a pod nią **wrysowana cyfra „1”**, co łamie zakaz tekstu na bitmapie | karta zegarowa wsuwana w zegar, gruby kontur, pomarańczowy akcent na karcie |
| `actions/study-course.png` i `actions/study-degree.png` | oba to zeszyty, przy 32 px nie do odróżnienia | kurs: zeszyt z ołówkiem; dyplom: rulon ze wstążką |
| `actions/rest-home.png` i `actions/rest-gym.png` | odpoczynek i trening czytają się podobnie | drzemka: poduszka z kocem; trening: hantel |
| `ui/need-job.png` | używana też jako ikona pustej pracy, nieczytelna | teczka z ogłoszeniem, bez liter |

### B. Rekwizyty, których brakuje

| Plik | Do czego |
|---|---|
| `ui/rival.png` | znacznik Kowalskiego na paskach postępu, dziś zwykła kreska |
| `actions/skip.png` | przycisk „Pomiń” przy turze Kowalskiego, dziś sam tekst |
| `ui/warning.png` | ostrzeżenie o zwolnieniu, dziś sam tekst na pomarańczowym tle |

### C. Czego nie zlecać SpriteCookowi

Portretów postaci i kadrów lokacji. Mamy jedenaście popiersi i czternaście kafelków w jednym stylu, zrobionych ręcznie. Dołożenie do tego grafiki z innego źródła rozjedzie planszę, a to jest dokładnie ten problem, który opisują `uwagi-p4.md` i `uwagi-p4b.md`.

Animacji. Narzędzie ma `animate_game_art`, ale silnik gry serwuje statyczne WebP i nie ma odtwarzacza klatek. Animowany pionek albo dymiący kebab wymagałby osobnej decyzji produktowej i pracy w silniku, nie tylko grafiki.

---

## Wykonane 11 września 2026

### Znalezione przy okazji: szachownica w dziesięciu ikonach

Skanując zestaw pod kątem przezroczystości, znalazłem, że **dziesięć ikon akcji miało wrysowaną szachownicę** zamiast alfy: kryty kwadrat zajmował około 40% obrazka i renderował się w grze jako jasny prostokąt na ciemnym panelu. Dotyczyło to: podania na kierownika, ciuchów, jedzenia, własnego lokalu, siłowni, drzemki, szukania pracy, kursu, dyplomu i zmiany w Nocnej Bule. Plus drobne resztki w encyklopedii, komputerze, pralce i pionku Kowalskiego.

Naprawione wypełnieniem od krawędzi przez piksele przezroczyste i prawie białe, z zatrzymaniem na ciemnym konturze obiektu. Razem 17 942 piksele. To była najpoważniejsza wada zestawu i nie miała nic wspólnego z SpriteCookiem.

Osobno: `ui/reliability.png` miał pod ikoną wrysowaną cyfrę „1”. Wycięta, ikona wyśrodkowana.

### Wymienione na nowe ze SpriteCooka

| Plik | Było | Jest |
|---|---|---|
| `actions/study-course.png` | notes z długopisem, blady przy 32 px | otwarta książka z ołówkiem, pomarańczowy kontur |
| `actions/study-degree.png` | portfel z rombem, mylący | rulon ze wstążką i pieczęcią |
| `actions/rest-home.png` | sama poduszka, blada | poduszka z pomarańczowym kocem |
| `actions/rest-gym.png` | ciemnoszary hantel | hantel z pomarańczowym chwytem |
| `ui/need-job.png` | baner z kluczem, nieczytelny | gazeta z lupą |
| `ui/music.png` | głośnik rysowany w CSS | radio tranzystorowe |

### Odrzucone

Zegar ścienny: ładny, ale dublowałby ikonę czasu w pasku górnym. Karta zegarowa na solidność: blada plama przy 32 px. Filiżanka i dzwonek z pierwszego testu.

**Solidność zostaje na starej ikonie** (zegar kontrolny), bo jest ciemna, ale za to odróżnialna od ikony czasu. Do poprawy przy okazji, z innym motywem niż zegar.

### Znaleziona sierota

`actions/search-job.png` nie jest używany nigdzie w kodzie. Do usunięcia albo do wykorzystania.

### Trafność po poprawce metody

Z trzema wzorcami stylu zamiast dwóch: **5 użytych z 7 tematów**. Wcześniej przy dwóch wzorcach było 1 z 3. Kontur przestał być za cienki. Kredytów zostało 232 z 752.
