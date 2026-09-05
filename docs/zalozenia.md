# Symulator życia PL - założenia projektowe
### (roboczy tytuł, inspiracja: Jones in the Fast Lane / No Time to Relax)

---

## 1. Koncepcja

Turowa gra symulująca życie w polskim mieście. Gracz zaczyna bez pracy, bez wykształcenia, w tanim wynajętym pokoju, z niewielką gotówką. Celem jest osiągnięcie zadanych progów w czterech kategoriach: **pieniądze, szczęście, wykształcenie, kariera**. Gra działa jak cyfrowa planszówka - plansza to mapa miasta, każda tura to jeden tydzień, a każda akcja (dojście gdzieś, praca, nauka) zużywa pulę czasu w turze.

Punkt odróżniający od oryginału: osadzenie w realiach polskich - urząd pracy, umowa o pracę / zlecenie, czynsz i kaucja, PIT, ZUS jako żart mechaniczny, korki na mieście, promocje w Biedronce, itd. To jednocześnie satyra i grywalna symulacja.

## 2. Cel gry i warunki zwycięstwa

- Na starcie gracz (lub grupa) ustawia docelowe progi w 4 kategoriach - im wyższe, tym dłuższa gra.
- Zwycięża pierwszy gracz, który osiągnie wszystkie 4 progi jednocześnie.
- Wariant bez rywalizacji: tryb solo na czas (np. "ile zdążysz w 30 tur") z punktacją końcową.
- Siatka bezpieczeństwa jak w oryginale: gracz nigdy nie "przegrywa" na trwałe - przy skrajnej biedzie dostaje pomoc (np. "500+ od cioci", zasiłek z MOPS jako żart).

## 3. Mechanika tury

- 1 tura = 1 tydzień.
- Gracz ma pulę czasu (np. 10-12 jednostek) do rozdysponowania.
- Poruszanie się po planszy kosztuje czas (odległość między budynkami).
- Akcje: praca (zarabia, kosztuje czas), nauka (podnosi wykształcenie, kosztuje czas i pieniądze), zakupy (jedzenie, ubrania, sprzęt do mieszkania), odpoczynek (podnosi szczęście), szukanie pracy, wizyta u lekarza/w banku.
- Na koniec tury: rozliczenie czynszu (co ile tur ustalane na starcie), sprawdzenie czy postać jest najedzona i ubrana - jeśli nie, kara w postaci utraty czasu lub szczęścia w kolejnej turze.

## 4. Plansza - lokacje (polska wersja)

| Oryginał (Jones) | Polski odpowiednik |
|---|---|
| Employment Office | Urząd Pracy / PUP |
| Hi-Tech University | Uniwersytet / szkoła językowa / kursy zawodowe (UW, UAM itp. jako fikcyjne skróty) |
| Monolith Burger | Budka z zapiekankami / kebab / fast food |
| Low-Cost Housing / Luxury Apartments | Stancja / kawalerka na wynajem / mieszkanie z kredytem |
| Bank | Bank (lokaty, kredyt, ROR) |
| Department Store | Galeria handlowa / Biedronka / sklep z ciuchami |
| Stock Market | Giełda / aplikacja inwestycyjna |
| Health Club | Siłownia / basen |

Dodatkowe polskie lokacje do rozważenia: urząd skarbowy (żartobliwe wydarzenia z PIT), przychodnia (NFZ vs prywatna), poczta/paczkomat, kawiarnia (spotkania towarzyskie -> szczęście).

## 5. Postacie

- 4-6 gotowych awatarów (bez wskazywania realnych osób), zróżnicowani wizualnie, bez przewagi mechanicznej na starcie (jak w oryginale - równość szans).
- Opcjonalnie: prosty customizer (kolor, fryzura, imię).

## 6. Ekonomia

- **Praca**: drabinka stanowisk od najprostszych (kurier, kasjer, sprzątacz) po wymagające wykształcenia (prawnik, informatyk, urzędnik). Awans wymaga edukacji i/lub stażu.
- **Edukacja**: kursy krótkie (szybkie, tanie, mały wzrost) i studia (długie, drogie, duży wzrost).
- **Czynsz**: rośnie losowo w czasie (inflacja), analogicznie do mechaniki Jonesa - presja na przeprowadzkę do lepszego / droższego mieszkania.
- **Ceny**: fluktuują (promocje / drożyzna), tworząc presję na planowanie zakupów.
- **Podatki/ZUS**: uproszczony, żartobliwy element - np. co jakiś czas "wizyta skarbówki" jako wydarzenie, a nie pełny system podatkowy (żeby nie przeciążać rozgrywki).

## 7. Zdarzenia losowe

Krótkie, humorystyczne zdarzenia z lokalnym kolorytem: korek na obwodnicy, wygrana w Lotto, awaria pralki, wizyta teściowej, zniżka na Allegro, kontrola bagażu w komunikacji miejskiej. Zdarzenia wpływają na czas, pieniądze lub szczęście.

## 8. Tryby gry

- **Solo vs. bot** ("Kowalski" jako odpowiednik "Jonesa").
- **Hot-seat** (2-4 graczy przy jednym urządzeniu) - najprostsze do zrobienia w pierwszej wersji.
- **Online multiplayer** - do rozważenia w kolejnym etapie (wymaga backendu/synchronizacji stanu).
- **Tryb spokojny** (bez negatywnych interakcji między graczami) vs. **tryb z przekrętami** (możliwość utrudniania rywalom, jak "hexy" w No Time to Relax).

## 9. Zakres MVP

Żeby projekt był wykonalny jako projekt hobbystyczny (analogicznie do Blokado):

1. Plansza z 6-8 lokacjami, single-file HTML/JS/CSS lub lekki framework.
2. Tryb solo vs. prosty bot (bot podejmuje losowe/sensowne decyzje wg prostych reguł).
3. Jedna ścieżka kariery na start (2-3 poziomy stanowisk), potem rozszerzać.
4. Podstawowe zdarzenia losowe (5-10 na start).
5. Zapis stanu gry lokalnie (localStorage), bez kont użytkowników.
6. Wersja PL, potencjalnie EN jak w Blokado.

## 10. Założenia techniczne

Rekomendacja zgodna z podejściem, które już sprawdziło się przy Blokado:

- **Stack**: czysty HTML/CSS/JavaScript (bez frameworka na start) albo lekki framework (Vue/Preact), jeśli stan gry zrobi się złożony - dla gry turowej z wieloma zmiennymi warto rozważyć framework wcześniej niż przy prostszym Blokado.
- **Struktura danych**: stan gry jako pojedynczy obiekt JSON (gracz, plansza, tura, ekonomia) - ułatwia zapis/wczytanie i debugowanie.
- **Silnik tur**: prosta maszyna stanów (faza ruchu -> faza akcji -> koniec tury -> rozliczenie).
- **Grafika**: plansza jako SVG lub siatka div-ów ze stylowaniem CSS, bez potrzeby silnika gier - podejście spójne z Blokado.
- **Hosting**: GitHub Pages, osobne repo (np. `PrzemoPle/[nazwa-gry]`), analogicznie do `blokado.fun`.
- **PWA**: manifest + service worker, żeby dało się zainstalować na telefonie jak Blokado.
- **Zapis gry**: localStorage na start (offline, bez backendu); ranking/multiplayer online to osobny etap wymagający prostego backendu (np. Firebase albo lekki serwer Node.js z WebSocket).
- **Lokalizacja**: od razu struktura z plikami tłumaczeń (PL na start, EN opcjonalnie), tak jak w Blokado.
- **Nazwa i domena**: do ustalenia - warto sprawdzić dostępność domeny .pl/.fun analogicznie do blokado.fun, zanim padnie ostateczna decyzja.

## 11. Otwarte pytania do decyzji

Rozstrzygnięcia na MVP: zobacz [decyzje.md](decyzje.md).

- Czy gra ma być osadzona konkretnie w Poznaniu (nazwy dzielnic, lokalne żarty), czy w fikcyjnym uniwersalnym polskim mieście?
- Ile ścieżek kariery na starcie (specjalizacja vs. uniwersalność)?
- Czy multiplayer online jest celem, czy hot-seat wystarczy na pierwszą wersję?
- Poziom satyry / czarnego humoru (np. wątki podatkowe, biurokracja) - jak mocno to eksponować?
