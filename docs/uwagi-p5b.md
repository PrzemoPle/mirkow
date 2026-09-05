# Uwagi do paczki P5b

Data: 5 września 2026. Odniesienie: `brief-p5.md`. Paczka P5-A i P5-B w komplecie (12 plików), wszystko wpięte. Zero odrzuconych.

## Co weszło bez zmian
Trener (hantel, gwizdek, dres bez logo, uśmiech), klucz brygadzisty, kalkulator kasjerki, filiżanka baristy, nóż i rożen kebabiarza. Alfa czysta, żadnych otoczek. Mapa Mirkowa na karcie zasad: bez tekstu, bilet w paski, pionek, kawa.

## Obrobione po mojej stronie
- `npc/barista.png` i `npc/kebabiarz.png`: kilkadziesiąt zbłąkanych pikseli poza sylwetką (wyspy poniżej 40 px) usunięte automatycznie.
- Winiety weekendów przyszły jako pełne prostokąty w lewych 55% kadru (scena z tłem, ostra pionowa krawędź), a nie jako wolny motyw na alfie. Tło `spokoj` i `impreza` jest jaśniejsze od papieru karty. Rozwiązanie w CSS: winieta mieszana z papierem (`mix-blend-mode: multiply`) i wygaszana maską w prawo, więc krawędzi nie widać. Bez zmian w plikach.

## Drobne, nie blokują
| Plik | Uwaga |
|---|---|
| `weekends/wycieczka.png`, `weekends/dom.png` | pełne scenki z wieloma detalami; na pasku 82 px czytają się gorzej niż `kasa` czy `impreza`, ale przechodzą |
| `brand/instrukcja.png` | plansza na mapie ma 5 kafelków zamiast układu 4 × 3; jako ilustracja instrukcji działa, nie jest mapą 1:1 |

P5-C (elektryk, linia włosów Kowalskiego) pozostaje opcjonalne. Grafiki na publikację są kompletne.
