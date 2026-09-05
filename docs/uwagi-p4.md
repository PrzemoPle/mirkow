# Uwagi do paczki P4 (postacie Mirkowa)

Data: 5 września 2026. Odniesienie: `brief-p4.md`. Paczka jest wpięta w grę i działa, poniżej tylko to, co się nie zgadza z briefem i jak to poprawić. Pliki bez uwag są w porządku i nie ma ich na liście.

## Błąd wspólny dla wszystkich 13 portretów

**Brak przezroczystości.** Brief: PNG-24 z alfą, popiersie bez tła. Dostarczone: PNG 8-bitowe z paletą, bez kanału alfa, każdy na innym tle (Krysia szare `#7F7F7F`, pani z PUP czarne, wykładowca zielone, kasjerka granatowe, lombardzista bordowe, elektryk granatowe, reszta na scenach albo dither). Skutek: w grze musiałem zamknąć wszystkie postacie w okrągłym okienku z przycięciem, żeby ukryć tła. Przy wolnej sylwetce w dymku wyglądałoby to lepiej.

**Jak poprawić:** wyeksportować każdą postać jako PNG-24 RGBA z przezroczystym tłem, sylwetka z jasnym obrysem 1 px (kontur trzyma się na ciemnym panelu `#16120E`). Bez tła scenicznego, bez jednolitych plam koloru.

## Błędy w konkretnych plikach

### `npc/sprzedawczyni.png`: zła postać
Brief: sprzedawczyni, kobieta ok. 40 lat, fartuch sklepowy, skrzynka jabłek albo skaner cenowy, kolor wiodący żółć Żuczka. Dostarczone: młody mężczyzna w fartuchu, na tle wnętrza sklepu. To jest inna osoba. Do namalowania od nowa według opisu.

### `avatars/kowalski-zadowolony.png` i `avatars/kowalski-wkurzony.png`: inny Kowalski
Brief: dokładnie ten sam kadr, strój i oświetlenie co `kowalski.png`, zmienia się tylko mina. Dostarczone:
- inna paleta: neutralny Kowalski jest w sepii na beżowym ditherze, obie miny są w różowo-oliwkowej palecie z limonkową skórą i różowym tłem,
- inna twarz: zadowolony ma pełniejszą twarz i inne włosy, wkurzony jest wyraźnie bardziej łysy i szerszy w szczęce,
- inny strój: neutralny ma szarą marynarkę i koszulę, zadowolony ma jasną kurtkę i kraciastą koszulę.

**Jak poprawić:** wziąć `kowalski.png` jako bazę (ten sam plik, ta sama paleta, to samo beżowe tło do czasu, aż będzie alfa), przemalować tylko oczy, brwi i usta. Uniesiony kciuk i ręka na czole mogą zostać, ale w tym samym oświetleniu co baza.

### `npc/urzedniczka.png`: chora paleta, brak rekwizytu
Skóra oliwkowo-żółta, tło czarne, całość wygląda jak inny styl niż reszta paczki. Brief: pieczątka i teczka, tu są tylko kartki. **Poprawić:** naturalna karnacja jak u Krysi i kasjerki, pieczątka w dłoni, alfa.

### `npc/lombardzista.png`: chora paleta, brak rekwizytu
Ten sam problem co wyżej: skóra różowo-zielona, tło bordowe. Lupa na czole jest, brakuje zegarka na łańcuszku. **Poprawić:** paleta jak reszta, zegarek kieszonkowy w dłoni, alfa.

### `npc/elektryk.png`: inny styl
Gładki, kreskówkowy rendering bez ditheru, duże błyszczące oczy. Odstaje od reszty (HD pixel / dither jak `avatars/ola.png`). Pilot jest, brak ściany kineskopów w tle (przy alfie i tak odpada). **Poprawić:** przemalować w stylu pozostałych portretów, alfa.

### `npc/kebabiarz.png`: tło zamiast postaci
Postać dobra (bandana, uśmiech, broda), ale za nią cała ulica z neonami i łuną. Brief: bez glow, rożen w tle, nóż do kebaba w ręku. **Poprawić:** wyciąć tło do alfy, dodać nóż. Rożen opcjonalnie jako mały element przy ramieniu.

### `npc/trener.png`: zła mina, brak rekwizytu
Brief: głośny, motywujący. Dostarczone: wykrzywiona, agresywna twarz, wygląda jak awantura. Brak hantla i gwizdka. **Poprawić:** szeroki uśmiech z otwartymi ustami (krzyczy „dawaj”, nie „wynocha”), hantel w dłoni albo gwizdek na szyi, alfa.

### Brak rekwizytów (postać dobra, do dorysowania jeden element)
| Plik | Brakuje |
|---|---|
| `npc/krysia.png` | ścierka przez ramię albo talerz z ciastem |
| `npc/wykladowca.png` | kreda albo gruba książka |
| `npc/kasjerka-banku.png` | kalkulator z rolką albo liczydło |
| `npc/barista.png` | filiżanka na spodku |
| `npc/brygadzista.png` | kask pod pachą (klucz jest, to drobiazg) |

Rekwizyt jest ważny, bo w grze portret ma 64 px w okienku i rekwizyt jest jedyną rzeczą, która mówi, gdzie ta osoba pracuje.

## Kolejność poprawek

1. Alfa dla wszystkich 13 (bez tego nie da się przejść na wolne sylwetki).
2. `sprzedawczyni.png` od nowa.
3. Dwie miny Kowalskiego z bazy `kowalski.png`.
4. Paleta: `urzedniczka.png`, `lombardzista.png`; styl: `elektryk.png`.
5. Mina trenera, tło kebabiarza.
6. Rekwizyty z tabeli.

Kod przyjmuje poprawione pliki pod tymi samymi nazwami bez zmian po stronie gry.
