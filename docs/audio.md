# Dźwięk w Mirkowie

Data: 5 września 2026. Decyzja produktowa: gra ma muzykę w tle i efekty. Do tej pory `CLAUDE.md` zabraniał dźwięku bez decyzji; ta decyzja jest tutaj.

## Założenie: brak plików audio

Muzyka i efekty są syntetyzowane na żywo przez Web Audio (`src/ui/audio/`). Zero megabajtów do pobrania, nic do precache, brak problemów z licencją. Brzmienie jest celowo w duchu gier DOS z lat 90.: kwadraty, trójkąt, prosty pad, pogłos.

- `song.ts`: utwór jako dane. D-moll, 84 BPM, szesnastki, dwie sekcje po 8 taktów w formie AABB. Melodia, podstawy akordów i kolory (tercja, septyma) na takt. Warianty pętli: co drugie przejście melodia oktawę niżej i ciszej, co czwarte tylko bas i pad. Czysta logika, z testem.
- `engine.ts`: kontekst audio, pogłos (splot z wygenerowanym szumem), scheduler z wyprzedzeniem 120 ms, instrumenty i efekty.
  - lead: dwa kwadraty rozstrojone o ±7 centów przez filtr dolnoprzepustowy z opadającą częstotliwością,
  - bas: trójkąt z krótką obwiednią, podstawa na 1 i 3, kwinta na 4,
  - pad: dwa rozstrojone piły na akord (podstawa, tercja, septyma) przez filtr z rezonansem, wolny atak, pogłos,
  - perkusja: cichy szum wysokoprzepustowy na 2 i 4,
  - efekty: dzwonek tramwaju (ruch), pieczątka (podanie, umowa, podwyżka), stuk (akcja), monety (płatna zmiana, bank, sklepy), papier (karta eventu), brzęczyk (błąd), trzy nuty w dół (koniec tygodnia), fanfara i lament (wygrana, przegrana), klik (przełączniki, karta Kowalskiego).
- Start po pierwszym geście gracza (klik „Wejdź do Mirkowa”, „Kontynuuj” albo dowolny klik w grze), zgodnie z polityką autoplay przeglądarek.
- Dwa przełączniki w pasku górnym: Muzyka i Dźwięki, stan w `localStorage` pod `mirkow.audio.v1`. Na telefonie tylko kropki z `aria-label`.

## Gdyby miały wejść prawdziwe nagrania

Silnik ma jedno miejsce do podmiany: `startMusic()` w `engine.ts`. Zamiast schedulera można tam wpiąć `AudioBufferSourceNode` z plikiem (`loop = true`) podłączonym do `c.music`, a efekty zostawić syntetyzowane albo podmienić pojedynczo w `playSfx`. Wymagania na taki utwór: pętla bez szwu, 84 BPM albo dowolne, 2–3 minuty, OGG/Opus 96 kbps (ok. 2 MB) plus zapasowo AAC dla Safari; wtedy `vite.config.ts` musi dopuścić większy plik w precache (`maximumFileSizeToCacheInBytes`).

Opis brzmienia, który był punktem wyjścia: 90s PC game soundtrack, DOS, FM synthesis, chiptune, lo-fi ambient, chill, powtarzalna minimalistyczna melodia, wolne tempo; NES APU, SNES SPC700, OPL3, miękkie kwadraty, trójkątny bas, rezonansowe pady, lekkie rozstrojenie, pogłos; nastrój nostalgiczny, przytulny, bez wydarzeń, lekko melancholijny, produktywna rutyna; pętla bez szwu, AABB z subtelnymi wariacjami.
