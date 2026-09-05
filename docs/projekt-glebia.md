# Projekt „Głębia”: Mirków jako pełny Jones, nie szkic

Data: 5 września 2026. Status: propozycja do decyzji, nic z tego nie jest jeszcze w kodzie.

Diagnoza po E1–E3 jest prosta: gra wygląda jak gra, ale gra się w nią jak w arkusz z jedną kolumną. Jedna drabinka (kebab), jedna kamienica, jedna liczba „wykształcenie”, przedmiotów zero, pracy nie da się stracić. W oryginale każda z tych rzeczy była systemem, a systemy się zazębiały. Ten dokument opisuje, co dokładnie robił Jones in the Fast Lane, i jak to przenieść do Mirkowa bez kopiowania 1:1.

---

## 1. Co naprawdę było w Jonesie (źródła na końcu)

| System | Jak działał w oryginale |
|---|---|
| **Czas** | Tura = tydzień, ok. 60 godzin do rozdysponowania. Praca to zmiana ok. 6 h, zajęcia ok. 10 h, każda podróż i zakup kosztuje czas. |
| **Praca** | Kilkanaście stanowisk w 6 firmach (Monolith Burger, Z-Mart, Socket City, bank, uniwersytet, fabryka). Każde ma trzy wymagania: **Experience** (staż), **Dependability** (solidność) i **dyplom**. Do części biurowych trzeba też mieć **strój** z QT Clothing. Fry cook w Monolith Burger bierze każdego. General Manager w fabryce to szczyt. |
| **Solidność** | Rośnie z każdą przepracowaną zmianą, **spada o 3 co tydzień** niezależnie od wszystkiego. Gdy spadnie 5 punktów poniżej wymagania stanowiska, przy następnej próbie pracy **wylatujesz**. To jest mechanika „nieobecność w pracy”. Podwyżki i awanse wymagają stażu i solidności. |
| **Edukacja** | Hi-Tech U: kilka dyplomów (Junior College, Trade School, kierunkowe, wyższe). Dyplom to ok. 10 zajęć, każde kosztuje czas i pieniądze. Komputer w domu skraca naukę. Dyplom nie gwarantuje pracy, bo liczba etatów zależy od koniunktury. |
| **Mieszkanie** | Dwa poziomy: Low-Cost Housing (czynsz ok. 325 $) i Le Securité (ok. 475 $). W tanim mieszkaniu **Wild Willy okrada** z przedmiotów; drogie jest bezpieczne i daje szczęście. Czynsz płatny co 4 tygodnie, stawka zależy od koniunktury, można ją **zamrozić** podpisując umowę w tanim okresie. |
| **Przedmioty** | Socket City (drogo, rzadziej się psuje, więcej szczęścia) i Z-Mart (tanio, częściej się psuje). Lodówka: jedzenie nie psuje się przez 6 tygodni, z zamrażarką 12. Telewizor, wideo, wieża: szczęście. Komputer: krótsze zajęcia i zarobek w weekendy. Rzeczy **widać w mieszkaniu**. Lombard: sprzedaż i odkup drożej. |
| **Jedzenie i ubranie** | Jedzenie co tydzień (Monolith Burger na miejscu albo Black's Market do lodówki), ubrania co ok. 8 tygodni albo „zgniją na ciele”. Ceny wahają się z tygodnia na tydzień. |
| **Bank** | Depozyty (bezpieczne przed weekendowym wydawaniem i rabunkiem), pożyczki, papiery (bony, złoto, srebro, akcje). Zdarza się plajta banku. |
| **Weekend** | Co tydzień „Oh What a Weekend”: losowa linijka, zwykle wydatek poniżej 200 $, powiązana z tym, co posiadasz. Posiadacz komputera zamiast wydawać zarabia. |
| **Koniunktura** | Ceny, czynsze i płace rosną i spadają. Recesja zamyka etaty i podnosi ceny. |
| **Cztery cele** | Kasa (gotówka + bank + papiery), szczęście, edukacja (liczba dyplomów), kariera (prestiż stanowiska). Progi ustawiane na starcie. |

Krytycy (Hardcore Gaming 101) wskazywali, że gra nie tłumaczy własnych mechanik i bywa „piekłem bez przegranej”. To ważna wskazówka: bierzemy głębię, ale **tłumaczymy ją w UI**, a nie chowamy.

---

## 2. Mirków: model docelowy

Cztery progi zostają. Pod nimi wchodzą cztery systemy, które dziś są płaskie.

### 2.1 Praca: firmy, drabinki, solidność

**Nowe parametry gracza** (widoczne w HUD przy pracy):

| Parametr | Zakres | Zmiana |
|---|---|---|
| **Staż** | 0+ | +1 za każdą zmianę, nigdy nie spada |
| **Solidność** | 0–100 | +4 za zmianę, **−3 na koniec każdego tygodnia** |
| **Strój** | zwykły / służbowy | zużywa się jak dziś; służbowy wymagany w biurach |

**Firmy i drabinki** (5 firm, 15 stanowisk). Płaca za zmianę 4 cz. Prestiż = wkład do progu „kariera”.

| Firma (lokacja) | Stanowisko | Płaca | Staż | Solidność | Dyplom | Strój | Prestiż |
|---|---|---|---|---|---|---|---|
| Nocna Buła | pomoc kuchenna | 220 | 0 | 0 | brak | zwykły | 5 |
| | kasjer | 280 | 4 | 20 | brak | zwykły | 12 |
| | kierownik zmiany | 420 | 12 | 40 | kurs zawodowy | zwykły | 30 |
| Żuczek | układacz półek | 240 | 0 | 10 | brak | zwykły | 8 |
| | kasjer | 300 | 6 | 25 | brak | zwykły | 15 |
| | kierownik sklepu | 480 | 16 | 50 | zarządzanie | służbowy | 40 |
| Nasza Kasa | kasjer bankowy | 380 | 8 | 40 | matura | służbowy | 25 |
| | doradca | 560 | 20 | 55 | ekonomia | służbowy | 50 |
| | dyrektor oddziału | 800 | 36 | 70 | ekonomia + magister | służbowy | 80 |
| PUP Mirków | referent | 340 | 4 | 35 | matura | służbowy | 20 |
| | naczelnik | 620 | 24 | 60 | administracja | służbowy | 60 |
| Zajezdnia (nowa) | monter | 320 | 2 | 20 | brak | zwykły | 15 |
| | brygadzista | 500 | 14 | 45 | kurs zawodowy | zwykły | 45 |
| | inżynier | 700 | 20 | 55 | inżynieria | zwykły | 65 |
| | dyrektor zajezdni | 950 | 40 | 75 | inżynieria + magister | służbowy | 100 |

Własny lokal (dzisiejszy `kebabLokal`) zostaje jako osobna ścieżka „przedsiębiorca”: buy-in 1800, prestiż 70, dochód zależny od koniunktury.

**Zasady:**

- Zatrudnienie i awans w **PUP** (jak dziś), ale tylko na stanowiska, których wymagania spełniasz. Lista pokazuje wszystkie stanowiska z powodem blokady („Staż 4 z 12”, „Brak: kurs zawodowy”, „Potrzebny strój służbowy”). To jest ten sam gating co w E2, tylko na 15 wierszach.
- **Zwolnienie:** gdy solidność spadnie 10 punktów poniżej wymagania stanowiska, przy następnej próbie pracy dostajesz wypowiedzenie (karta „Zwolnienie”). Tydzień bez pracy to −3, więc dwa tygodnie nieobecności na stanowisku z wymaganiem 40 przy solidności 45 kończą się wylotem. Gracz widzi to w HUD jako pasek „Solidność 42 (min. 40)”.
- **Podwyżka:** w PUP akcja „Poproś o podwyżkę” (1 cz), dostępna gdy staż ≥ wymaganie + 8; +10% płacy, max dwie na stanowisko. Odmowa, gdy solidność poniżej wymagania + 10.
- **Koniunktura:** stan miasta losowany co 8 tygodni: **boom / normalnie / recesja**. Boom: płace +15%, ceny +10%. Recesja: płace −15%, czynsz nowych umów −20%, **jedna firma zamyka nabór** (etat zostaje, ale nie zatrudniają), event „Redukcja” może zwolnić z 10% szansą tych, których solidność jest poniżej wymagania + 5. Stan koniunktury pokazany w pasku górnym jako pieczątka.

### 2.2 Edukacja: dyplomy i egzaminy, nie licznik

Dzisiejsze „wykształcenie 0–100” zostaje jako pasek do progu, ale jego źródłem są **dyplomy**, każdy z liczbą zajęć i egzaminem.

| Dyplom | Wymaga | Zajęcia | Koszt zajęć | Punkty edu | Odblokowuje |
|---|---|---|---|---|---|
| Kurs zawodowy | nic | 4 | 120 zł, 3 cz | 10 | kierownik zmiany, brygadzista |
| Matura wieczorowa | nic | 6 | 100 zł, 3 cz | 15 | kasjer bankowy, referent, licencjaty |
| Zarządzanie (licencjat) | matura | 8 | 250 zł, 3 cz | 20 | kierownik sklepu |
| Ekonomia (licencjat) | matura | 8 | 250 zł, 3 cz | 20 | doradca |
| Administracja (licencjat) | matura | 8 | 250 zł, 3 cz | 20 | naczelnik |
| Inżynieria (licencjat) | matura | 10 | 300 zł, 3 cz | 25 | inżynier |
| Magister | dowolny licencjat | 10 | 400 zł, 4 cz | 30 | dyrektorzy |

Razem 140 punktów; próg „normalny” 60 to np. kurs + matura + jeden licencjat + kawałek.

**Egzamin** (to jest odpowiedź na „jak się nie uczyłeś, to nie zdajesz”):

- Po skompletowaniu zajęć w WSMiK pojawia się akcja „Egzamin” (2 cz, 80 zł opłaty).
- Szansa zdania = **40% + 10% za każde zajęcia w ostatnich 4 tygodniach** (max 100%). Kto robi zajęcia regularnie, zdaje pewnie. Kto zrobił cztery zajęcia pół roku temu i wraca po dyplom, ma 40%.
- Przedmiot „Encyklopedia” (Lombard) +10%, „Komputer” +10% i zajęcia kosztują 2 cz zamiast 3.
- Oblany egzamin: strata opłaty, powtórka za tydzień, −3 szczęścia. Karta „Oblany egzamin”.
- Bonus fabularny: pierwszy dyplom daje +5 szczęścia i wpis do dziennika.

### 2.3 Mieszkanie: trzy poziomy, kradzieże, przedmioty w pokoju

| Mieszkanie | Czynsz bazowy | Miejsca na przedmioty | Kradzieże | Szczęście co tydzień | Kaucja przy wprowadzce |
|---|---|---|---|---|---|
| Pokój u Krysi (stancja) | 400 | 3 | tak | 0 | 0 (start) |
| Kawalerka w bloku | 700 | 6 | nie | +1 | 1 czynsz |
| Mieszkanie nad Skwerem | 1200 | 10 | nie | +3 | 1 czynsz |

- Przeprowadzka to akcja na kafelku domu („Gospodarz”): 2 cz + kaucja. Można wrócić do tańszego, kaucja przepada w połowie.
- **Umowa zamraża czynsz** na stawce z dnia podpisania. W recesji stawki nowych umów są niższe: opłaca się przepisać umowę (jak w Jonesie). Sufit 800 z E3 znika, bo presję daje koniunktura, nie licznik.
- **Kradzież na stancji:** co tydzień 8% szansy (12% gdy masz ≥3 przedmioty), znika jeden losowy przedmiot. Karta „Zdzichu z klatki”. W kawalerce i wyżej: nigdy. Gotówka na koncie w banku jest bezpieczna, gotówka w kieszeni może zniknąć w evencie „Kieszonkowiec w tramwaju” (10% kasy, max 300).
- **Pokój jest widoczny.** Kafelek domu w panelu miejsca pokazuje wnętrze mieszkania z półkami, na których stoją posiadane przedmioty (sprite’y). To jest moment „dorobiłem się”, którego dziś nie ma.

### 2.4 Przedmioty: sklep Elektro-Mir i Lombard

**Elektro-Mir** (nowy kafelek, odpowiednik Socket City): nowe, drogie, rzadko się psują, więcej szczęścia. **Lombard** (nowy kafelek, Z-Mart + pawn shop w jednym): używane za 60% ceny, 15% szansy na awarię co 8 tygodni, sprzedaż własnych rzeczy za 50%.

| Przedmiot | Cena (nowy) | Efekt mechaniczny | Szczęście przy zakupie |
|---|---|---|---|
| Lodówka | 900 | jedzenie kupowane hurtem: do 6 tyg. zapasu za jedną wizytę, ceny −10% | +3 |
| Telewizor | 700 | +1 szczęścia co tydzień, weekendy z serialem | +4 |
| Wieża | 600 | +1 szczęścia co tydzień | +3 |
| Komputer | 1800 | zajęcia 2 cz zamiast 3, egzamin +10%, weekend „fucha” +60–180 zł | +4 |
| Pralka | 800 | ubranie zużywa się 5 tyg. zamiast 3, odporność na event „Pralka padła” | +2 |
| Rower | 500 | trasy ≥ 2 cz kosztują 1 cz mniej | +3 |
| Kanapa | 400 | drzemka +5 zamiast +3 | +2 |
| Encyklopedia | 300 | egzamin +10% | +1 |
| Garnitur (strój służbowy) | 350 | wymagany w biurach, zużywa się 6 tyg. | +1 |

Przedmioty mają stan: sprawny / zepsuty (naprawa w Elektro-Mir 20% ceny, 1 cz). Zepsuty nie daje efektu.

### 2.5 Jedzenie, ubranie, szczęście

- **Jedzenie:** Żuczek jak dziś (1 tydz. na wizytę, z lodówką do 6). Nocna Buła: „Zjedz na miejscu” 1 cz, 25 zł, +1 tydzień jedzenia i +1 szczęścia. Głód: −2 cz i −3 szczęścia (dziś tylko czas).
- **Ubranie:** zwykłe w Żuczku (3 tyg., 5 z pralką), służbowe w Lombardzie albo Elektro-Mir (6 tyg.). Praca w biurze bez stroju: zmiana niemożliwa (powód: „Potrzebny strój służbowy”).
- **Szczęście spada o 1 co tydzień** (w Jonesie relaksacja też). Źródła: drzemka, kawa, siłka, przedmioty, lepsze mieszkanie, wyjścia z weekendów, dyplomy, awanse (+5 przy każdym).

### 2.6 Bank: konto, lokata, kredyt, akcje

- **Konto (ROR):** wpłata/wypłata 1 cz. Kasa na koncie jest odporna na kieszonkowca i weekendowe wydatki. Do progu „pieniądze” liczy się wszystko: kieszeń + konto + lokata + akcje po kursie.
- **Lokata:** jak w E3.
- **Kredyt:** do 3× miesięcznej płacy, 4% za 4 tygodnie, rata automatyczna co 4 tygodnie. Dwie zaległe raty: event „Komornik” zabiera przedmiot albo 20% kasy.
- **Akcje „Mirkowskie Zakłady Tramwajowe”:** jeden walor, kurs losowy z trendem koniunktury (boom +5–15%/tydz., recesja −5–15%). Kupno/sprzedaż 1 cz. Prosta giełda, jeden wykres w panelu banku.

### 2.7 Weekendy zamiast „eventu co turę”

Dzisiejsze 10 kart eventów zostają jako **wydarzenia losowe** (szansa 45%). Do tego co tydzień **jedna linijka weekendu** w dzienniku, zależna od posiadania:

- telewizor: „Maraton seriali. +2 szczęścia.” / „Abonament. −30 zł.”
- komputer: „Fucha po znajomości. +120 zł.”
- kawalerka i wyżej: „Sąsiedzi na grilla. +2 szczęścia.”
- stancja: „Krysia zrobiła awanturę o łazienkę. −2 szczęścia.”
- rower: „Wycieczka nad jezioro. +3 szczęścia.”
- nic: „Spacer po Skwerze. +1 szczęścia.” / „Piwo z Kowalskim. −40 zł, +2.”

Weekendy nie mają kart, tylko wpis w dzienniku z ikoną przedmiotu. Dwadzieścia linijek na start.

### 2.8 Kowalski

Rywal gra tymi samymi zasadami. Heurystyka dostaje: wybór firmy według dostępnych dyplomów, naukę pod konkretny awans, przeprowadzkę gdy stać, lodówkę i komputer jako pierwsze zakupy, pilnowanie solidności (nie opuszcza tygodnia bez zmiany, gdy jest blisko progu). Test balansu jak w E3: bot kontra bot kończy partię w zadanym przedziale.

---

## 3. Plansza

11 lokacji plus Skwer. Układ 4×3 na desktopie, 3×4 na telefonie (CSS, ta sama siatka).

```
[PUP Mirków]  [WSMiK]     [Nasza Kasa]  [Zajezdnia]
[Na Rogu]     [Skwer]     [Elektro-Mir] [Siłka Rzeźba]
[Dom]         [Żuczek]    [Lombard]     [Nocna Buła]
```

Kafelek „Dom” pokazuje aktualne mieszkanie (trzy warianty grafiki). Trasy i koszty: ten sam graf co dziś plus krawędzie do trzech nowych pól, koszt 1–2 cz. Rower obniża.

---

## 4. Co widać w interfejsie (żeby głębia nie była ukryta)

- **Panel pracy** w HUD: firma, stanowisko, płaca, pasek solidności z zaznaczonym minimum, staż. Ostrzeżenie „Za tydzień wylecisz” gdy solidność jest 7 poniżej minimum.
- **PUP:** pełna lista stanowisk pogrupowana firmami, każde z powodem blokady. To jest mapa kariery, gracz widzi cel.
- **WSMiK:** lista dyplomów z postępem „5 / 8 zajęć”, szansą zdania egzaminu liczoną na żywo i tym, co dyplom odblokowuje.
- **Dom:** wnętrze z przedmiotami, przycisk „Przeprowadzka” z porównaniem trzech mieszkań.
- **Bank:** saldo konta, lokata, kredyt, jeden wykres akcji.
- **Pasek górny:** pieczątka koniunktury (boom / normalnie / recesja).
- **Dziennik:** weekendy, zwolnienia, egzaminy, kradzieże.

---

## 5. Grafiki do zamówienia (P3)

Wszystko w stylu P0–P2. Zero tekstu.

| Zestaw | Pliki | Wymiar |
|---|---|---|
| Nowe kafelki | `tiles/zajezdnia.png`, `tiles/elektro.png`, `tiles/lombard.png` | 512×384 |
| Dom w trzech wersjach | `tiles/home-stancja.png` (jest: `home.png`), `tiles/home-kawalerka.png`, `tiles/home-apartament.png` | 512×384 |
| Wnętrza mieszkań (tło panelu) | `rooms/stancja.png`, `rooms/kawalerka.png`, `rooms/apartament.png` | 1024×576, z pustymi półkami na przedmioty |
| Przedmioty (sprite’y do wnętrza) | `items/lodowka.png`, `telewizor`, `wieza`, `komputer`, `pralka`, `rower`, `kanapa`, `encyklopedia`, `garnitur` | 256×256, alfa |
| Ikony akcji | `actions/work-shop.png`, `work-bank.png`, `work-pup.png`, `work-depot.png`, `exam.png`, `move.png`, `raise.png`, `loan.png`, `stocks.png`, `sell.png`, `repair.png` | 64×64 |
| Dyplomy | `diplomas/kurs.png`, `matura.png`, `zarzadzanie.png`, `ekonomia.png`, `administracja.png`, `inzynieria.png`, `magister.png` | 128×128, alfa |
| Karty zdarzeń | `events/zwolnienie.png`, `events/oblany-egzamin.png`, `events/zdzichu.png`, `events/kieszonkowiec.png`, `events/komornik.png`, `events/redukcja.png`, `events/dyplom.png`, `events/awans.png` | 768×1024 |
| Pieczątki koniunktury | `ui/boom.png`, `ui/recesja.png` | 128×128, alfa |

Razem ok. 45 plików. Minimum na pierwszy etap (G1 poniżej): 3 nowe kafelki i 4 ikony pracy.

---

## 6. Kolejność wdrożenia

Każdy etap jest grywalny osobno i ma test balansu bot kontra bot.

| Etap | Zakres | Nowy stan gry |
|---|---|---|
| **G1: praca** | staż, solidność, 5 firm i 15 stanowisk, zwolnienia, podwyżki, koniunktura, strój służbowy, 3 nowe kafelki | `version: 2` (nowy zapis, stare partie nie wczytają się, komunikat) |
| **G2: nauka** | 7 dyplomów, zajęcia z postępem, egzamin z szansą, oblanie | rozszerzenie v2 |
| **G3: dom** | 3 mieszkania, przeprowadzka, umowa i zamrożenie czynszu, kradzieże, przedmioty w Elektro-Mir i Lombardzie, widoczny pokój, awarie | rozszerzenie v2 |
| **G4: pieniądze i weekendy** | konto, kredyt, komornik, akcje, 20 linijek weekendu, ubranie i jedzenie wg §2.5 | rozszerzenie v2 |
| **G5: Kowalski** | heurystyka pod nowe systemy, test balansu 3 presetów | bez zmian stanu |

Szacunek pracy w sesjach z AI: G1 i G2 po jednej długiej sesji, G3 dwie (dużo UI), G4 jedna, G5 jedna. Grafiki mogą dochodzić etapami, kod ma fallback na dzisiejsze kafelki.

Po G5 wracamy do E4 (publikacja), bo nie ma sensu publikować wersji, którą za chwilę wymieniamy.

---

## 7. Czego nie kopiować z Jonesa

- **Ukrywania mechanik.** Wszystko z §4 ma być na ekranie.
- **„Piekła bez przegranej”:** siatka bezpieczeństwa zostaje (ciocia, MOPS), ale zwolnienie i oblany egzamin mają być odczuwalne, nie druzgocące.
- **Sześciu godzin pracy.** Zostajemy przy 10 cz na tydzień; głębia idzie w decyzje, nie w liczbę kliknięć.
- **Plajty banku.** Losowa utrata oszczędności bez ostrzeżenia to frustracja, nie satyra.

---

## Źródła

- [Jones in the Fast Lane, Wikipedia](https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane): cztery cele, lokacje, koniunktura, weekendy, Wild Willy.
- [Hardcore Gaming 101](https://www.hardcoregaming101.net/jones-in-the-fast-lane/): czynsz 325 $ co 4 tyg., ubrania co 8 tyg., 10 zajęć na dyplom, ukryte efekty przedmiotów, krytyka.
- [Jones in the Fast Lane Wiki: Dependibility](https://jonesinthefastlane.fandom.com/wiki/Dependibility), [Jobs](https://jonesinthefastlane.fandom.com/wiki/Jobs), [List of Jobs](https://jonesinthefastlane.fandom.com/wiki/List_of_Jobs): −3 solidności co tydzień, zwolnienie 5 punktów poniżej wymagania, trzy wymagania stanowiska.
- [Wiki: Manager (Monolith Burgers)](https://jonesinthefastlane.fandom.com/wiki/Manager_(Monolith_Burgers)), [Degrees](https://jonesinthefastlane.fandom.com/wiki/Degrees), [Junior College](https://jonesinthefastlane.fandom.com/wiki/Junior_College): przykład wymagań (30 exp, 40 dep, Junior College).
- [Wiki: Apartments](https://jonesinthefastlane.fandom.com/wiki/Apartments), [Rent](https://jonesinthefastlane.fandom.com/wiki/Rent): 325 $ i 475 $, kradzieże tylko w tanim, zamrażanie czynszu.
- [Wiki: Items](https://jonesinthefastlane.fandom.com/wiki/Items), [Appliances](https://jonesinthefastlane.fandom.com/wiki/Appliances), [Refrigerator](https://jonesinthefastlane.fandom.com/wiki/Refrigerator), [Socket City](https://jonesinthefastlane.fandom.com/wiki/Socket_City), [Z-Mart](https://jonesinthefastlane.fandom.com/wiki/Z-Mart): lodówka 6/12 tygodni, drogi sklep psuje się rzadziej.
- [HandWiki](https://handwiki.org/wiki/Software:Jones_in_the_Fast_Lane), [en-academic](https://en-academic.com/dic.nsf/enwiki/404107): lombard, Black's Market, komputer skraca zajęcia i zarabia w weekendy, papiery wartościowe w banku.
- [gry-online.pl](https://www.gry-online.pl/gry/jones-in-the-fast-lane/z71231): opis PL.

Liczby w §2 to nasze propozycje startowe do balansu, nie odczyt z Jonesa.
