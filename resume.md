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
- Den aktive profils farve er appens accent: logo, aktiv fane, primærknapper,
  nøgletal, links og glow-rammen om appen. Accentvariablerne (`--ac` m.fl.)
  sættes ud fra profilfarven i `applyProfileAccent()`; i lyst tema mørknes den
  (42 % blandet med næsten-sort) for læsbarhed. Program-typernes farver og
  advarsler er uændrede.
- Rammen er et glow uden streg. På iPhone runder den hjørnerne (64px) og fader
  ud over de øverste 10 % via en maske, så den står som et U.
- Lyst/mørkt tema med toggle.
- Programbygger: egne programmer med øvelser fra katalog, egne øvelser eller
  kopieret fra et andet program.
- Øvelser kan tilføjes til de indbyggede programmer under Program-fanen
  ("+ TILFØJ ØVELSE") og fjernes igen. Gemmes i `users/{uid}/settings/progext`
  som `{programtype:[øvelser]}` og lægges på af `getProgram`, så de også kommer
  med i Log og uge-analysen. Egne programmer redigeres i programbyggeren
  ("REDIGER PROGRAM" fører derind).

## Kropsmål & Ernæring (nyt modul)
- Beregninger ligger i `nutrition.js` (rent modul, ingen DOM/Firebase), UI i
  `index.html`. Testes med `node --test "tests/*.test.mjs"` — 48 tests.
- BMR (Mifflin-St Jeor) → aktivitetsfaktor fra skridt + træninger/uge (loft
  1,75) → TDEE → kaloriemål efter mål: fedttab −15 %, recomposition −10 %,
  vedligeholdelse 0, muskelopbygning +7 %.
- Sikkerhedsgulv: 1.200 kcal (kvinde) / 1.500 kcal (mand). Under det — eller
  under hvilestofskiftet — vises en advarsel i stedet for bare tallet.
- Protein 1,6 g/kg (interval 1,4–1,8); kilo over 90 tæller halvt. Fibre
  14 g/1000 kcal af vedligeholdelsesbehovet, holdt i 25–35 g.
- Vægttrend: 7-dages snit mod ugen før. Adaptivt forslag efter ~3 uger, i skridt
  på 100–150 kcal, som brugeren selv skal godkende — appen ændrer aldrig selv.
- Taljemål + løftet volumen giver recomposition-signalet ("kan være tegn på").
- Data pr. profil: `settings/nutrition` (mål + de inputs det blev regnet ud fra
  + log over justeringer), `waist/{dato}` = `{cm}`, og de eksisterende
  `weights/{dato}`-dokumenter udvidet med en valgfri `note`.
- Adgang: egen KOST-fane i fanelinjen, og et kort i I dag-fanen. Fanenavnene er
  forkortet (Overblik → I dag) så seks faner kan være på én linje.
- Onboarding i 4 trin (mål → krop → aktivitet → resultat). Træninger/uge
  prefilles fra planen. Ingen Apple Health/Health Connect i projektet, så skridt
  indtastes manuelt.

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
