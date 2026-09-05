# Brief P5: trener od nowa, rekwizyty, winiety weekendów, karta instrukcji

> **Dostarczone 5 września 2026 (P5b):** paczki P5-A i P5-B w komplecie, wpięte. Uwagi: `uwagi-p5b.md`. P5-C nadal opcjonalne.

Data: 5 września 2026. Uzupełnia `brief-p4.md`, `uwagi-p4.md` i `uwagi-p4b.md`. Zamyka wszystkie otwarte pozycje grafik przed publikacją.

## Styl lock (bez zmian)

HD pixel / dither, ten sam ilustrator, to samo światło i pora dnia co `avatars/ola.png`, `npc/wykladowca.png` (z P4b), `tiles/kebab.png`, `brand/panorama.png`. Papier `#E8DCC8`, tusz `#2B2622`, akcent `#D4652F`. Tło aplikacji ciemne `#16120E`; wszystko z alfą będzie leżało na tym ciemnym tle albo na papierze `#E8DCC8` (karty), więc kontur musi trzymać się na obu.

## Twarde zasady (te same, ale po P4b trzeba je powtórzyć)

1. **Zero tekstu, cyfr, logotypów, marek, realnych twarzy i zdjęć.** Trener z P4b (zdjęcie z logo Adidas) to dokładnie to, czego nie wolno. Odrzucony.
2. **PNG-24 RGBA**, sRGB 8 bit. Alfa tam, gdzie tabela mówi „alfa”.
3. **Alfa przez maskę, nie przez klucz koloru.** W P4b wszystkie portrety miały 2–4 px magentowej otoczki po wycięciu kolorem. Jeśli narzędzie potrafi tylko klucz, po wycięciu zdjąć 3 px otoczki od wewnątrz (defringe / remove matte) i sprawdzić na czarnym tle w powiększeniu 400%.
4. Jasny obrys sylwetki 1 px `#E8DCC8` z alfą ok. 55% (tak jak w P4b, to było dobrze).
5. Nazwy plików małymi literami, myślniki, dokładnie jak w tabelach. Bez `@2x`, bez `_dark`, bez sprite sheetów.
6. Na końcu paczki lista plików z wymiarami w pikselach, jak przy P1.

---

## A. Trener od nowa (priorytet, 1 plik)

`art/npc/trener.png`, **512 × 512, alfa**, popiersie od pasa w górę, jak pozostałe postacie z P4b (głowa w górnych 60% kadru, twarz lekko w lewo, margines 6%).

| Element | Jak ma być |
|---|---|
| Postać | trener siłowni, ok. 40 lat, dowolna płeć, mocna sylwetka, krótkie włosy albo związane, ręcznik na karku |
| Strój | dres z lat 90./2000. w kolorze pomarańczowym `#D4652F` z jednym białym pasem na ramieniu, **bez żadnego logo, napisu ani emblematu**, zamek pod szyję |
| Rekwizyt | hantel w uniesionej dłoni (pierwszy plan, na wysokości ramienia) i gwizdek na sznurku na szyi |
| Mina | szeroki uśmiech z otwartymi ustami, brwi uniesione, energia „dawaj, jeszcze jedno powtórzenie”. Nie krzyk, nie złość, nie zamknięte oczy. Wzór nastroju: kebabiarz z P4b, tylko głośniej |
| Kolor wiodący | pomarańcz akcentu, reszta stonowana |
| W grze | okienko 64 px w panelu Siłki Rzeźba obok kwestii „Trening, dwa bilety, osiem szczęścia” |

## B. Rekwizyty do istniejących postaci (4 pliki, ponowny eksport)

Te same pliki co w P4b, ta sama postać, ta sama poza i paleta. Dodać jeden element i wyeksportować ponownie pod tą samą nazwą. Rekwizyt jest jedyną rzeczą, która przy 64 px mówi, gdzie ta osoba pracuje.

| Plik | Co dodać | Gdzie w kadrze |
|---|---|---|
| `art/npc/brygadzista.png` | klucz francuski (ten sam co w pierwszej wersji z P4) | w prawej dłoni na wysokości piersi, główka klucza widoczna nad dolną krawędzią kadru |
| `art/npc/kasjerka-banku.png` | kalkulator z rolką papieru albo drewniane liczydło | na dole kadru po lewej, przed postacią, jakby stał na blacie |
| `art/npc/barista.png` | filiżanka na spodku, z parą | w dłoni na wysokości piersi, po stronie twarzy |
| `art/npc/kebabiarz.png` | długi nóż do kebaba | w uniesionej dłoni przy ramieniu, ostrze skierowane w górę i w bok, bez kropli |

## C. Poprawki opcjonalne (można pominąć)

| Plik | Co | Po co |
|---|---|---|
| `art/npc/elektryk.png` | dodać ziarno / dither jak u wykładowcy, mniej gładkich przejść na skórze | dziś odstaje stylem |
| `art/avatars/kowalski-zadowolony.png`, `art/avatars/kowalski-wkurzony.png` | linia włosów jak w `kowalski.png` (wyższe czoło, rzadsze włosy na czubku) | miny mają pełniejsze włosy niż neutralny portret |

## D. Winiety weekendów (6 plików)

**Gdzie w grze:** dolny pasek karty eventu po końcu tygodnia. Pod tytułem i efektem eventu jest linijka „WEEKEND Piwo z Kowalskim. -40 zł, +2 szczęścia”. Winieta będzie tłem tego paska: obraz po lewej, tekst po prawej na papierze. Pasek ma na desktopie ok. 330 × 82 px, na telefonie ok. 290 × 72 px.

**Format:** `768 × 192` (4:1), **alfa**, poziomo. Motyw w **lewych 55%** kadru (do 420 px), prawa strona pusta (przezroczysta), bo tam leży tekst. Motyw ma czytać się w 82 px wysokości: 2–3 duże kształty, nie scenka z detalami. Bez ludzi z rozpoznawalną twarzą (sylwetki od tyłu OK). Kolory na papierze `#E8DCC8`: tusz i akcent plus jeden kolor wiodący, jak na kartach eventów. Waga < 60 KB.

| Plik | Linijki z gry (copy w `pl.ts`, nie maluj) | Motyw |
|---|---|---|
| `art/weekends/spokoj.png` | spacer po Skwerze, kawa na balkonie, widok na Skwer, weekend na kanapie | ławka parkowa, drzewo, dwa gołębie, spadający liść |
| `art/weekends/impreza.png` | piwo z Kowalskim, impreza przy pustej lodówce, goście w mieszkaniu, grill z sąsiadami | dwie butelki i miska chipsów na stole, girlanda z trzech żarówek nad nimi |
| `art/weekends/deszcz.png` | lało cały weekend, awantura Krysi o łazienkę | okno z kroplami, parapet, za szybą rozmyty blok |
| `art/weekends/wycieczka.png` | rowerem nad jezioro, kino na Rogu | rower oparty o drzewo, za nim tafla jeziora, koc na trawie |
| `art/weekends/dom.png` | maraton seriali, nowa płyta, granie do nocy, quiz z encyklopedią, ciasto od Krysi | kanapa z kocem, świecący ekran telewizora w ciemnym pokoju, kubek |
| `art/weekends/kasa.png` | fucha na komputerze, pranie sąsiadki, abonament, zakupy impulsowe, zrzutka na tort | otwarty portfel, trzy monety, paragon bez cyfr (same kreski) |

Kod dobierze winietę po kategorii linijki, więc sześć plików pokrywa wszystkie 22 weekendy.

## E. Karta „Jak się gra” (1 plik)

**Gdzie w grze:** jednorazowa karta zasad przy pierwszej partii (papierowa karta 560 px szerokości: nagłówek z pieczątką, cztery punkty, przycisk „Wiem, gram”). Grafika wejdzie jako obraz nad tytułem, na całą szerokość karty.

**Format:** `art/brand/instrukcja.png`, `1024 × 512` (2:1), **nieprzezroczysta**, tło w kolorze papieru `#E8DCC8` (obraz przechodzi w kartę bez widocznej krawędzi). Waga < 200 KB. Zero tekstu, także na mapie.

**Motyw:** rozłożona na stole papierowa mapa Mirkowa, widziana lekko z góry. Na mapie układ planszy 4 × 3 jako kolorowe plamki kafelków w tych samych kolorach wiodących co w grze (żółty Żuczek, zieleń Zajezdni, niebieski Elektro-Mir, czerwień Nocnej Buły, brąz Lombardu), połączone torami tramwajowymi jak na planszy, ale **bez nazw**. Na mapie stoi pionek (ten sam styl co `pawns/ola.png`), obok leży bilet tramwajowy (paski, bez cyfr) i kubek kawy z parą. Klimat instrukcji z pudełka gry planszowej. Światło wieczorne, cień od kubka.

---

## Czego nie malować

Zdjęć i wycinków ze zdjęć. Logotypów jakichkolwiek marek (także wymyślonych). Tekstu na mapie i biletach. Sprite sheetów, wersji `@2x`, wariantów ciemnych. Dodatkowych postaci poza trenerem.

## Checklist paczek

**Paczka P5-A (minimum, 5 plików):**
```
art/npc/trener.png
art/npc/brygadzista.png
art/npc/kasjerka-banku.png
art/npc/barista.png
art/npc/kebabiarz.png
```

**Paczka P5-B (7 plików):**
```
art/weekends/spokoj.png
art/weekends/impreza.png
art/weekends/deszcz.png
art/weekends/wycieczka.png
art/weekends/dom.png
art/weekends/kasa.png
art/brand/instrukcja.png
```

**Paczka P5-C, opcjonalna (3 pliki):** `npc/elektryk.png`, `avatars/kowalski-zadowolony.png`, `avatars/kowalski-wkurzony.png`.

Przed wysłaniem każdy plik z alfą obejrzeć na czarnym tle w powiększeniu 400%: żadnej różowej ani innej kolorowej otoczki.
