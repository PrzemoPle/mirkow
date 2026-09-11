# Audyt: dlaczego Mirków przytłacza

Data: 11 września 2026. Zakres: gra na żywo w trzech stanach (tydzień 1, tydzień 41 na uczelni, tydzień 41 w PUP), desktop 1440 × 900 i telefon 390 × 844. Pomiary z DOM, nie z oka.

**Czytam to jako:** przebudowę zachowującą istniejącą grę planszową w przeglądarce dla zwykłego gracza na telefonie i desktopie, w języku „wieczór przy planszy”, na obecnych tokenach ciemnego motywu plus prawdziwa skala typograficzna i pokazywanie rzeczy dopiero, gdy są potrzebne.

**Diagnoza w jednym zdaniu:** gra pokazuje wszystko naraz, w jednej wadze wizualnej i w jednym kolorze akcentu, więc nic nie prowadzi oka i gracz czyta zamiast grać.

---

## 1. Liczby z jednego ekranu

Tydzień 41, desktop 1440 × 900, bez przewijania, stan spoczynku:

| Co | Ile |
|---|---|
| Fragmenty tekstu | 92 |
| Słowa | 201 |
| Liczby | 42 (w PUP: 50) |
| Ramki i wypełnione pudełka | 74 |
| Obrazy | 42 |
| Różne rozmiary pisma | 11 |
| Różne tła | 10 |
| Elementy w kolorze akcentu | 31 |

Pętla gry wymaga trzech decyzji na turę: gdzie jechać, co zrobić, czy kończyć tydzień. Ekran podaje 201 słów i 42 liczby. To jest źródło słowa „przytłacza”, i to nie jest kwestia gustu.

---

## 2. Siedem przyczyn, w kolejności siły

### 2.1 To samo zdanie trzy razy 🔴

W PUP gracz czyta w pionie:

- pasek statusu: „PUP Mirków. Tablica ofert, podania i podwyżki. Tu zaczyna się każda kariera.”
- opis miejsca w panelu: „Tablica ofert, podania i podwyżki. Tu zaczyna się każda kariera.” (dosłownie to samo)
- kwestia postaci: „Pracuje pan? To po co pan tu stoi? A, podwyżka. Formularz.”
- nagłówek: „Tablica ofert”
- podpowiedź: „Podanie kosztuje 2 cz. Możesz zejść niżej albo zmienić firmę.”

**40 słów prozy przed pierwszą klikalną ofertą.** Każdy z tych bloków dodawałem osobno, w dobrej wierze, w odpowiedzi na osobne uwagi z audytów. Razem tworzą ścianę.

### 2.2 Brak skali typograficznej 🔴

Na ekranie jest 11 rozmiarów pisma, z czego osiem mieści się między 11,5 a 16,8 px. W CSS: 0.72, 0.78, 0.8, 0.85, 0.9, 0.95, 1, 1.05 rem. Osiem rozmiarów w zakresie pięciu pikseli to nie hierarchia, to szum. Nic nie czyta się jako główne, nic jako drugorzędne, wszystko jest „średnie”. Oko nie ma ścieżki, więc skanuje wszystko po kolei.

### 2.3 Akcent wydany na wszystko 🔴

31 elementów w pomarańczu na jednym ekranie, w tym 20 segmentów pasków postępu. Ten sam kolor znaczy dziś: kliknij mnie, recesja, cel tygodnia, jesteś tu, twoja płaca, kończy się jedzenie, dźwięk włączony, postęp statystyki. Kolor użyty 31 razy nie jest akcentem, jest tłem.

### 2.4 Jeden materiał na wszystko 🟡

74 pudełka, prawie wszystkie w tym samym przepisie: ciemne wypełnienie, ramka 1 px, promień 4 px. Plansza (bohater ekranu) i wybór muzyki (ustawienie dotykane raz) mają tę samą wagę wizualną i to samo pudełko. Nic się nie cofa w tło.

### 2.5 Pętla gry nie daje odpowiedzi 🔴

W całej grze są 4 klatki kluczowe i 12 przejść CSS. Dwie z tych animacji to samo wejście kart. Kliknięcie akcji, czyli czynność powtarzana sześć razy na turę, daje: wciśnięcie przycisku o 1 px, zmianę tekstu w pasku statusu i mignięcie koloru kwoty na pół sekundy. Statystyki przeskakują bez ruchu. Nic nie wylatuje z klikniętego wiersza. Kafelek celu nie reaguje.

To jest powód, dla którego „nie chodzi fajnie”. Mechanika jest dobra, ale wciśnięcie przycisku wygląda jak wysłanie formularza.

### 2.6 Telefon: jedna trzecia ekranu na obudowę 🔴

Przy 390 × 844 pasek górny ma 162 px, pasek celu 93 px. **295 px, czyli 35% ekranu, zanim zacznie się plansza.** Plansza dostaje 44%, a jej ostatni rząd i tak chowa się pod dolną kartą. Wybór muzyki ma własny wiersz nad celem tygodnia: ustawienie dotykane raz w życiu leży wyżej niż informacja, po co gramy.

### 2.7 Wejście do lokacji nie ma momentu 🟡

Pionek jedzie ładnie, ale w chwili dojazdu panel podmienia treść natychmiast, bez przejścia. Dojazd i tak jest najdłuższą animacją w grze, a jego puenta jest sucha.

---

## 3. Co działa i zostaje bez zmian

Grafika i paleta „Wieczór w Mirkowie”. Metafora planszy: papierowe tabliczki, bilety tramwajowe jako czas. Postacie w lokacjach z kwestiami zależnymi od stanu. Powody blokad przy każdej akcji. Karty zdarzeń w pełnym kadrze. To są rzeczy, których nie ruszam.

---

## 4. Zasada naprawy

**Jedna rzecz naraz.** Plansza jest grą. Reszta pojawia się, kiedy jest potrzebna, a poza tym siedzi cicho.

Konkretnie oznacza to trzy reguły, które da się sprawdzić:

1. W spoczynku na ekranie jest **maksymalnie jedna liczba na podsystem**. Szczegóły po dotknięciu.
2. Akcent pojawia się **maksymalnie trzy razy** na ekranie i zawsze znaczy „to możesz teraz kliknąć”.
3. Każda akcja gracza ma **widoczny skutek w miejscu kliknięcia**, nie tylko w pasku statusu.

---

## 5. Kolejność prac

### Grupa A: odchudzenie tekstu i koloru (pół sesji, największa zmiana na oko)

- Pasek statusu przestaje powtarzać opis miejsca. Zostaje sama nazwa i skutek ostatniej akcji.
- Opis miejsca pokazuje się tylko przy pierwszej wizycie w danej lokacji w partii. Potem zostaje sama postać z kwestią.
- Podpowiedzi list („Podanie kosztuje 2 cz…”) chowają się pod ikonę „i” przy nagłówku.
- Skala pisma: cztery rozmiary zamiast ośmiu (12 / 14 / 16 / 22 px), jedna rzecz główna na region.
- Akcent tylko na to, co klikalne, i na koniec tygodnia. Paski postępu neutralne z akcentem wyłącznie na czubku wypełnienia. Recesja, „jesteś tu”, płaca i cel tygodnia na papierze.

### Grupa B: mniej pudełek, więcej powietrza (pół sesji)

- Cztery karty statystyk zamieniają się w jeden wiersz: ikona, liczba, cienka linia postępu. Bez dziesięciu segmentów na sztukę.
- Karta pracy zwija się do jednej linijki („Własny lokal, 580 zł, solidność 44 z 40”) i rozwija po kliknięciu. Prestiż, staż i podwyżki schodzą do rozwinięcia.
- Wiersz Kowalskiego zostaje, ale bez ikon przy każdej liczbie.
- Pudełka tylko tam, gdzie coś jest osobnym obiektem. Grupy w panelu rozdzielane odstępem, nie ramką.

### Grupa C: pętla zaczyna odpowiadać (jedna sesja)

- Liczby statystyk przewijają się do nowej wartości zamiast przeskakiwać.
- Z klikniętego wiersza wylatuje w górę to, co gracz właśnie zyskał („+15 wykształcenia”, „−250 zł”) i znika.
- Kafelek, do którego przyjechał pionek, dostaje krótki błysk światła w oknach.
- Panel lokacji wchodzi przenikaniem, zsynchronizowanym z końcem jazdy pionka.
- Koniec tygodnia dostaje jeden oddech: bilety gasną po kolei, zanim wejdzie karta zdarzenia.
- Wszystko powyżej wyłączone przy `prefers-reduced-motion`.

### Grupa D: telefon (pół sesji)

- Pasek górny do jednego wiersza: nazwa, kasa, dwie twarze.
- Dźwięk chowa się pod jedną ikonę, panel ustawień otwiera się jak arkusz miejsca.
- Pasek celu zostaje sam, bez statusu.
- Cel: plansza zaczyna się powyżej 180 px i zajmuje ponad 55% pierwszego ekranu.

---

## 6. Czego nie robię

Nie zmieniam palety ani grafik. Nie dodaję nowych ekranów, zakładek ani ustawień. Nie ruszam mechaniki, nazw ani zapisu. Nie dokładam animacji dla ozdoby: każda z grupy C odpowiada na konkretne kliknięcie gracza.

## 7. Jak sprawdzę, że pomogło

Ten sam pomiar co w §1, na tym samym zapisie z tygodnia 41. Cel: poniżej 120 słów, poniżej 20 liczb, poniżej 40 pudełek, 4 rozmiary pisma, maksymalnie 3 elementy w akcencie, plansza powyżej 55% pierwszego ekranu na telefonie.
