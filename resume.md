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
- Ramme rundt om hele appen lyser i den aktive profils farve.
- Lyst/mørkt tema med toggle.
- Programbygger: egne programmer med øvelser fra katalog, egne øvelser eller
  kopieret fra et andet program.
- Øvelser kan tilføjes til de indbyggede programmer under Program-fanen
  ("+ TILFØJ ØVELSE") og fjernes igen. Gemmes i `users/{uid}/settings/progext`
  som `{programtype:[øvelser]}` og lægges på af `getProgram`, så de også kommer
  med i Log og uge-analysen. Egne programmer redigeres i programbyggeren
  ("REDIGER PROGRAM" fører derind).

## Kendte problemer
- Email/kodeord-login er ikke aktiveret i Firebase → fejl på "Opret konto".
  Fix: aktivér Email/Password i Firebase Console, ELLER fjern email/kodeord-UI'et.
- Er en session allerede gemt for dagen, ændrer en nytilføjet øvelse ikke den
  gemte log — den kommer først med på næste session med det program.

## Næste opgaver
Ingen åbne. De to tidligere punkter (øvelser til eksisterende programmer og
profilfarvet ramme om appen) er løst.

## Bemærkning
Design-, sti- og statusoplysninger er tjekket mod `index.html` (2058 linjer).
At email/kodeord-login mangler i Firebase kan ikke verificeres fra koden — kun
fejlteksten findes i appen.
