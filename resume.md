# LØFT — Status og næste skridt

## Kort resumé
LØFT er en dansk træningstracker-PWA i ét `index.html`, hostet på GitHub Pages
via GitHub Actions. Firebase-auth med Google-login virker; email/kodeord er ikke
slået til i Firebase (kendt fejl på "Opret konto"). Multi-profil er bygget:
adskilt historik pr. profil under `users/{uid}/profiles/{profil-id}/sessions/`,
profilkort med initial + farve, skift via badge øverst.

## Design
- To temaer med toggle (🌙-knap øverst), valget gemmes i `localStorage` under
  `loft_theme`.
- Mørkt tema (standard): baggrund #0e0e0e, neongrøn accent #c8ff00.
- Lyst tema (`data-theme="light"` på `<html>`): varm sandbaggrund #efe9dd,
  mørk orange accent #c2611c.
- Farverne ligger som CSS-variabler på `:root` og bliver overskrevet af
  `:root[data-theme="light"]` — accenten er `--ac`.
- Titel-font: Bebas Neue. Brødtekst: DM Mono.

## Virker
- Google Sign-In via Firebase.
- PWA installerbar (manifest, service worker, ikoner).
- Multi-profil med adskilt historik pr. profil.
- Profilvælger: kort med initial + farve, "+" til ny profil, 8 farver, skift via badge.
- Lyst/mørkt tema med toggle.
- Programbygger: egne programmer med øvelser fra katalog, egne øvelser eller
  kopieret fra et andet program.

## Kendte problemer
- Email/kodeord-login er ikke aktiveret i Firebase → fejl på "Opret konto".
  Fix: aktivér Email/Password i Firebase Console, ELLER fjern email/kodeord-UI'et.

## Næste opgaver
1. Tilføje øvelser til et eksisterende program (fx maveøvelser til full body).
   Delvist løst: egne programmer kan redigeres, og "⧉ FRA PROGRAM" kopierer
   øvelserne fra fx full body ind i et eget program. De indbyggede programmer
   kan stadig ikke redigeres direkte.
2. Få den yderste div-ramme til at lyse i den aktive profils farve.
   Ikke lavet — profilfarven bruges kun i badge og profilkort.

## Bemærkning
Design-, sti- og statusoplysninger er tjekket mod `index.html` (2058 linjer).
At email/kodeord-login mangler i Firebase kan ikke verificeres fra koden — kun
fejlteksten findes i appen.
