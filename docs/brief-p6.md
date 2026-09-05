# Brief P6: ikony dźwięku

Data: 5 września 2026. Uzupełnia `brief-p5.md`. Dwie ikony do grupy „Dźwięk” w pasku górnym (wybór utworu i przełącznik efektów). Do czasu dostawy UI rysuje zastępcze znaki (nuta z fontu, głośnik z CSS).

Styl lock jak przy ikonach HUD z P2/P3 (`art/ui/time.png`, `art/ui/stat-happiness.png`): HD pixel, gruba sylwetka, kolor tusz `#2B2622` i akcent `#D4652F` z jasnym papierem `#E8DCC8` w środku, czytelne w 20 px.

**Twarde zasady:** zero tekstu i liter, PNG-24 RGBA z alfą przez maskę (nie klucz koloru), bez otoczki, bez `@2x`, nazwy plików dokładnie jak w tabeli.

| Plik | Wymiar | Motyw | Gdzie w grze |
|---|---|---|---|
| `art/ui/music.png` | 64 × 64, alfa | głośnik radia tranzystorowego z lat 90. (prostokąt z kratką i pokrętłem) albo pojedyncza nuta w stylu pieczątki; jeden obiekt, bez fal dźwiękowych | obok listy utworów, 18 px na desktopie i 22 px na telefonie |
| `art/ui/sfx.png` | 64 × 64, alfa | dzwonek tramwajowy (dzwon z młoteczkiem, ten sam motyw co dźwięk ruchu) | przycisk „Efekty”, te same rozmiary |

Stan „wyłączone” robi CSS (przygaszenie i przekreślenie), więc **nie** rysować wariantów off.

**Opcjonalnie, 3 pliki:** miniatury utworów do listy, `art/ui/track-wieczor.png`, `art/ui/track-poranek.png`, `art/ui/track-noc.png`, 64 × 64, alfa: latarnia o zmierzchu, tramwaj o świcie, neon kebaba nocą. Wejdą, jeśli lista utworów zmieni się z natywnego `select` na własny panel.

Na końcu paczki lista plików z wymiarami w pikselach.
