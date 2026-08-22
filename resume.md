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
- Profiler kan omdøbes og skifte farve bagefter: ✎ på profilkortet åbner samme
  modal som ved oprettelse og skriver `{name,color}` med merge, så historikken
  og `createdAt` bevares.
- Den aktive profils farve er appens accent: logo, aktiv fane, primærknapper,
  nøgletal, links og glow-rammen om appen. Accentvariablerne (`--ac` m.fl.)
  sættes ud fra profilfarven i `applyProfileAccent()`; i lyst tema mørknes den
  (42 % blandet med næsten-sort) for læsbarhed. Program-typernes farver og
  advarsler er uændrede.
- Kanten sidder kun i venstre og højre side, aldrig i top og bund: i mørkt tema
  to lysende striber (gradienter), i lyst tema en 2px streg. Begge tegnes i CSS
  ud fra `--ac`, så temaskift slår igennem med det samme. På iPhone fader kanten
  ud over de øverste 10 % via en maske.
- Lyst/mørkt tema med toggle.
- Indbyggede programmer: træk, skub, ben, helkrop, overkrop, underkrop, core,
  mobilitet, crossfit og hjemme (styrke uden udstyr). CORE og MOBILITET er korte sessioner tænkt som tillæg
  på en hvile- eller træningsdag.
- Katalogets grupper er muskelgrupper plus MOBILITET og CROSSFIT. Kun de syv
  muskelgrupper (`MUSCLE_GRPS`) tæller i uge-analysen: crossfit-øvelser mappes
  til den muskelgruppe de reelt træner, og mobilitet/sjipning holdes helt ude
  (`NO_VOLUME`), så de hverken giver falsk volumen eller "umappet"-advarsler.
- Presets i Plan: PPL (3 dage), Push/Pull (2 dage), "Vægte + hjemme" (7 dage:
  3× helkrop, 2× hjemme, 2× mobilitet — score 80) og "100-planen" (helkrop,
  overkrop, crossfit, hjemme + 3 mobilitetsdage — score 100 i analysen).
- CROSSFIT indeholder pull-ups og færre ben-dominerede sæt, så et pas kan ligge
  i samme uge som rigtig styrketræning. Uden trækøvelser gav programmet 18 sæt
  ben og nul biceps, og så var 100 i analysen umuligt med crossfit i planen.
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

## Træningspartner (delt data på to telefoner)
- `ROOT` er den konto data hentes fra: egen uid, eller partnerens hvis eget
  brugerdokument har `partnerOf`. Alle 29 Firestore-stier bruger `ROOT`.
- Ejeren laver en invitation under Plan → koden gemmes i `invites/{kode}` med
  `{owner, expires}` (24 timer). Partneren logger ind med sin egen Google-konto,
  indtaster koden og hendes app skriver `users/{ejer}/members/{hendes-uid}` +
  `partnerOf` på hendes eget dokument, hvorefter invitationen slettes.
- Firestore-reglerne giver adgang hvis `request.auth.uid == userId` ELLER der
  findes et medlemsdokument. Medlemskab kan kun oprettes for én selv og kun med
  en gyldig, ikke-udløbet kode. Ingen Cloud Functions.
- Adgangen går begge veje og er fuld: partneren kan også rette i ejerens data.
  Ejeren kan fjerne en partner igen under Plan; partneren kan selv forlade.
- **Reglerne deployes ikke af GitHub Actions** — de skal udgives i Firebase
  Console (eller med `firebase deploy --only firestore:rules`).

## Opdatering (så man ikke skal slette genvejen)
- CI stempler samme git-sha i `<meta name="build">` og i `version.txt`.
- Appen henter `version.txt` med `no-store` ved opstart og hver gang den kommer i
  forgrunden (højst hvert 30. sekund). Er sha'en en anden end den kørende,
  ryddes cachen og siden genindlæses — undtagen midt i en logning eller
  opsætning, hvor der i stedet vises en "NY VERSION KLAR"-bjælke.
- Plan-fanen viser den kørende version og har "SØG EFTER OPDATERING".
- `sw.js` henter egne sider/scripts med `cache:"reload"`, så iOS ikke kan blive
  ved med at levere en gammel `index.html` gennem HTTP-cachen. Cache-fallback
  ved offline er bevaret.

## Kendte problemer
- Email/kodeord-login er ikke aktiveret i Firebase → fejl på "Opret konto".
  Fix: aktivér Email/Password i Firebase Console, ELLER fjern email/kodeord-UI'et.
- Er en session allerede gemt for dagen, ændrer en nytilføjet øvelse ikke den
  gemte log — den kommer først med på næste session med det program.

## Næste opgaver
Kræver kontoejeren:
1. Email/kodeord-login: aktivér Email/Password i Firebase Console, ELLER fjern
   "Opret konto"-fanen så kun Google-login står.

Beslutninger:
2. Recomposition-satsen: −10 % som specificeret (1.920 kcal for eksempel-
   personen) vs ca. −14 % (1.830), som rammer sanity-intervallet 1.700–1.850.
3. iOS: bliv på PWA (gjort) vs native skal om web-appen vs rigtig native app.
   Native gevinst = Apple Health (skridt + vægt) og baggrundstimer.
4. Notifikationer via web push (kræver Firebase Cloud Messaging).
5. Firestore-reglerne for træningspartner skal udgives i Firebase Console, før
   en partner kan tilslutte sig.

Funktionshuller:
5. Indbyggede programmer: kun tilføjede øvelser kan fjernes. Indbyggede øvelser
   kan ikke fjernes, få ændret sæt/reps/hvil eller flyttes i rækkefølgen.
6. Allerede gemt session: en nytilføjet øvelse kommer først med næste gang.
7. Skridt indtastes manuelt (ingen Health-integration i en PWA).
8. Cyklus-tracking ikke bygget — kostmodulet kan udvides uden at røre
   beregningerne.

Teknisk oprydning:
9. Kun beregningslaget har automatiske tests; UI-flows testes manuelt.
10. Ingen linter.

## Bemærkning
Design-, sti- og statusoplysninger er tjekket mod koden (index.html ~2.570 linjer
+ nutrition.js).
At email/kodeord-login mangler i Firebase kan ikke verificeres fra koden — kun
fejlteksten findes i appen.
