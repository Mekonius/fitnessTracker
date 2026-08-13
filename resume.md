# LØFT — Projektkontekst for Claude Code

## Hvad er LØFT
En træningstracker bygget som PWA (Progressive Web App). Hostet på GitHub Pages
under brugeren `mekonius` (mekonius.github.io). Deploy sker automatisk via
GitHub Actions når der committes til repoet.

## Ejer / brug
- Kenneth er administrator og eneste konto-ejer.
- Kenneth og hans hustru træner sammen på én telefon, derfor multi-profil.
- Sprog i UI: dansk. Kommuniker og skriv kommentarer på dansk.

## Stack
- Vanilla HTML/CSS/JS i `index.html` (ingen build-step, ingen framework).
- Firebase til auth og datalagring.
- PWA: `manifest.json`, service worker (`sw.js`), ikoner.

## Design
- Mørkt tema, baggrund ca. #0e0e0e.
- Neongrøn accentfarve.
- Titel-font: Bebas Neue. Brødtekst: DM Mono.

## Auth (Firebase)
- Google Sign-In: AKTIVERET og virker.
- Email/kodeord-login: IKKE aktiveret i Firebase. "Opret konto"-fanen giver
  derfor fejlen "Email/kodeord-login er ikke slået til i Firebase". Enten
  aktivér Email/Password i Firebase Console → Authentication → Sign-in method,
  eller fjern email/kodeord-UI'et helt (kun Google-login).

## Multi-profil (bygget og virker)
- Firebase-datastruktur: `users/{uid}/profiles/{profil-id}/workouts/`
- Helt adskilt træningshistorik pr. profil.
- Profilkort med initial + farve. "+" opretter ny profil. 8 farver at vælge.
- Skift aktiv profil via badge øverst.

## Ønsker / næste skridt
- Kunne tilføje øvelser til et eksisterende program (fx maveøvelser til full body).
- Den yderste div-ramme skal lyse i den aktive profils farve, så man kan se
  hvilken profil der er valgt.

## Arbejdsprincipper
- Bevar den enkle no-build-arkitektur — én `index.html`, ingen bundler.
- Ingen brud på eksisterende Firebase-struktur eller Google-login.
- Skriv kortfattet, dansk, direkte.
