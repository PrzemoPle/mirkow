# Uwagi do paczki P4b (poprawki postaci)

Data: 5 września 2026. Odniesienie: `brief-p4.md`, `uwagi-p4.md`. Paczka wpięta w grę z jednym wyjątkiem i jedną obróbką po mojej stronie.

## Odrzucone

### `npc/trener.png`: zdjęcie z logo
To nie jest grafika w stylu gry, tylko wycięte zdjęcie kobiety w dresie z logo i napisem Adidas. Łamie trzy twarde zasady briefu naraz: zero tekstu i logotypów na bitmapie, zero realnych marek, zero realnych twarzy. W grze został trener z pierwszej paczki (pixel art, bez alfy, w okrągłym okienku). **Do zrobienia od nowa:** HD pixel / dither jak reszta, dres bez logo, szeroki uśmiech, hantel albo gwizdek, alfa.

## Poprawione po mojej stronie (do wiadomości, żeby następna paczka nie miała tego samego)

**Różowa obwódka po wycięciu tła.** Wszystkie 12 pozostałych portretów miało 2–4 px magentowej poświaty pod jasnym obrysem, czyli resztkę wyciętego magentowego tła (kluczowanie koloru). Na ciemnym panelu wyglądało to jak różowa aureola wokół włosów. Usunąłem to automatycznie (piksele w odcieniu magenty przy krawędzi zastąpione średnią sąsiadów), pliki w `public/art/` są już czyste. **Na przyszłość:** wycinać maską alfa z programu, nie kluczem koloru; jeśli klucz, to po wycięciu zdjąć 3 px otoczki od wewnątrz (defringe / „remove matte”).

## Drobne, nie blokują

| Plik | Co nie pasuje | Jak poprawić |
|---|---|---|
| `npc/brygadzista.png` | zniknął klucz francuski z pierwszej wersji, kasku nadal nie ma | klucz w dłoni na wysokości piersi |
| `npc/kasjerka-banku.png` | brak kalkulatora z rolką albo liczydła | jeden z tych dwóch w kadrze |
| `npc/barista.png` | brak filiżanki | filiżanka na spodku w dłoni |
| `npc/kebabiarz.png` | brak noża do kebaba | nóż w dłoni albo przy ramieniu |
| `npc/elektryk.png` | rendering nadal gładszy niż reszta, mniej ditheru | więcej ziarna jak u wykładowcy; można zostawić |
| `avatars/kowalski-*.png` | obie miny są teraz spójne ze sobą i w naturalnej palecie, ale mają pełniejsze włosy niż neutralny `kowalski.png` | dopasować linię włosów do bazy; można zostawić |

## Co jest dobrze i weszło bez zmian

Alfa we wszystkich plikach, jasny obrys, naturalna paleta u pani z PUP i lombardzisty, sprzedawczyni według opisu, pieczątka, kreda z książką, lupa z zegarkiem, ścierka Krysi, kebabiarz bez ulicy, miny Kowalskiego w jednym stroju.
