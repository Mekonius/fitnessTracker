// comeback.js — Athletic Comeback: 6 ugers program, ren data og uge-logik.
// Ingen DOM, ingen Firebase. Testes af tests/comeback.test.mjs.
//
// Programmet er inspireret af Peter Falktofts alsidige træningsstil og er ikke
// hans officielle program. Brugeren træner alene, så øvelserne er valgt så et
// sæt altid kan afbrydes sikkert: ingen frie tunge løft uden spotter, ingen
// træning til failure, ingen maks-test, ingen højintense intervaller.

export const COMEBACK_KEY = "athletic-comeback-falktoft-6w";
export const COMEBACK_WEEKS = 6;

export const COMEBACK = {
  key: COMEBACK_KEY,
  version: 2,
  name: "Athletic Comeback – Falktoft-inspireret",
  subtitle: "Styrke + kondition · 6 ugers roligt comeback",
  goal: "Stærk og atletisk krop med bedre kondition",
  level: "Comeback efter længere træningspause",
  equipment: "Motionscykel, maskiner, kabeltårn, håndvægte, måtte/bænk",
  desc: "Et seksugers comeback-program inspireret af Peter Falktofts alsidige " +
    "træningsstil. To helkropspas med sikre solo-øvelser og et gradvist opbygget " +
    "konditionspas. Fokus er styrke, udholdenhed og lysten til at træne – ikke rekorder. " +
    "På grund af nylig uforklaret ørhed bør træningen først genoptages efter lægelig vurdering.",
  safetyTitle: "Vigtigt før opstart",
  safety: "Du har for nylig oplevet uforklaret ørhed og kraftig utilpashed. Få lægens " +
    "vurdering, før du genoptager styrke- og konditionstræning. Programmet kan gemmes nu " +
    "og bruges, når træning igen er forsvarlig. Stop et pas med det samme ved ny ørhed, " +
    "synsforstyrrelser, usædvanlig åndenød, brystsmerter eller besvimelsesfornemmelse.",
  emergency: "Ved besvimelse under træning, brystsmerter, åndenød eller vedvarende " +
    "hjertebanken: søg akut lægehjælp. Ring 112 ved tegn på alvorlig akut sygdom.",
  restNote: "Hold 90–120 sekunders pause mellem styrkesæt — længere hvis du har brug for det. " +
    "Bevæg dig kontrolleret og undgå at holde vejret under løft."
};

// Uge 1–2, 3–4 og 5–6 deler samme ordination. Faserne er 0-indekserede.
export function phaseOfWeek(week) {
  const w = Math.min(Math.max(Math.round(Number(week) || 1), 1), COMEBACK_WEEKS);
  return Math.floor((w - 1) / 2);
}

// ── Passene ───────────────────────────────────────────────────────────────────
// phases[fase] = {sets, reps}. Pause og tip følger øvelsen hele vejen.
export const SESSIONS = [
  {
    id: COMEBACK_KEY + "_a",
    letter: "A",
    name: "Comeback A · Fundament",
    day: 1,                                   // mandag
    color: "#7bb0e0",
    desc: "Helkrop i maskiner og kabel — rolige, stabile øvelser du trygt kan tage alene.",
    warmup: "5–8 min rolig motionscykel + ét let opvarmningssæt inden dagens første større løft. Ingen hurtige stillingsskift.",
    cooldown: "5 min rolig cykling eller gang, hvis det er symptomfrit.",
    exercises: [
      { id: "leg_press", name: "Benpres (maskine)", rest: "120s", tip: "Kontrolleret dybde. Undgå at presse til maksimal belastning.",
        phases: [{ sets: 2, reps: "10" }, { sets: 2, reps: "10" }, { sets: 3, reps: "8-12" }] },
      { id: "chest_press", name: "Brystpres (maskine)", rest: "120s", tip: "Stabil siddestilling. Ingen failure — stop med gentagelser i reserve.",
        phases: [{ sets: 2, reps: "10" }, { sets: 2, reps: "10" }, { sets: 3, reps: "8-12" }] },
      { id: "cable_row", name: "Siddende kabelroning", rest: "90s", tip: "Træk albuerne bagud uden at svinge kroppen.",
        phases: [{ sets: 2, reps: "10" }, { sets: 2, reps: "10" }, { sets: 3, reps: "8-12" }] },
      { id: "leg_curl", name: "Seated leg curl", rest: "90s", tip: "Roligt tempo og fuld kontrol hele vejen.",
        phases: [{ sets: 2, reps: "12" }, { sets: 2, reps: "12" }, { sets: 3, reps: "10-12" }] },
      { id: "pallof_press", name: "Pallof press (kabel)", rest: "90s", tip: "Stabil kropsstamme. Brug let modstand og træk vejret roligt.",
        phases: [{ sets: 2, reps: "10/side" }, { sets: 2, reps: "10/side" }, { sets: 3, reps: "10/side" }] },
      { id: "tricep_pushdown", name: "Triceps pushdown (kabel)", rest: "90s", since: 2, tip: "Albuerne ind til siden. Let modstand og fuld kontrol — stop med gentagelser i reserve.",
        phases: [{ sets: 2, reps: "12" }, { sets: 2, reps: "12" }, { sets: 3, reps: "10-12" }] }
    ]
  },
  {
    id: COMEBACK_KEY + "_c",
    letter: "C",
    name: "Comeback C · Kondition",
    day: 3,                                   // onsdag
    color: "#5fc9b0",
    fromWeek: 3,                              // ikke obligatorisk i uge 1–2
    cardio: true,
    desc: "Kontrolleret motor på motionscykel. Taletesten gælder: du skal kunne tale i hele sætninger.",
    warmup: "De første 5 minutter er opvarmningen — start roligt.",
    cooldown: "Afslut med 5 minutter let, så pulsen falder stille og roligt.",
    exercises: [
      { id: "bike_steady", name: "Motionscykel — roligt tempo", rest: "—", unit: "MIN", isTime: true,
        tip: "Rolig til jævn intensitet, ca. RPE 3–4. Ingen intervaller og ingen sprint. Stop ved ørhed eller utilpashed.",
        phases: [{ sets: 1, reps: "—" }, { sets: 1, reps: "20 min" }, { sets: 1, reps: "30 min" }] }
    ]
  },
  {
    id: COMEBACK_KEY + "_b",
    letter: "B",
    name: "Comeback B · Atletisk base",
    day: 5,                                   // fredag
    color: "#c9a0e0",
    desc: "Helkrop med kropsvægt og lette håndvægte — atletisk base uden faldrisiko.",
    warmup: "5–8 min rolig motionscykel.",
    cooldown: "5 min let bevægelse, hvis det er symptomfrit.",
    exercises: [
      { id: "goblet_squat_bench", name: "Goblet squat til bænk", rest: "120s", tip: "Let håndvægt eller kropsvægt. Bænken bag dig er en stabil dybdemarkør.",
        phases: [{ sets: 2, reps: "8" }, { sets: 2, reps: "8-10" }, { sets: 3, reps: "8-12" }] },
      { id: "lat_pulldown", name: "Lat pulldown", rest: "90s", tip: "Træk til øvre bryst og sænk kontrolleret.",
        phases: [{ sets: 2, reps: "10" }, { sets: 2, reps: "10" }, { sets: 3, reps: "8-12" }] },
      { id: "incline_pushup", name: "Incline push-up mod bænk", rest: "90s", tip: "Jo højere støtte, jo lettere. Alternativ: brystpres i maskine.",
        phases: [{ sets: 2, reps: "8" }, { sets: 2, reps: "8-10" }, { sets: 3, reps: "8-12" }] },
      { id: "glute_bridge", name: "Glute bridge på måtte", rest: "90s", tip: "Bevæg roligt. Ingen tunge vægte over hoften i denne fase.",
        phases: [{ sets: 2, reps: "10" }, { sets: 2, reps: "10" }, { sets: 3, reps: "12" }] },
      { id: "dead_bug", name: "Dead bug", rest: "60s", tip: "Hold lænden stabil mod gulvet og træk vejret roligt.",
        phases: [{ sets: 2, reps: "8/side" }, { sets: 2, reps: "8/side" }, { sets: 3, reps: "8-10/side" }] },
      { id: "shoulder_press", name: "Skulderpres (maskine)", rest: "90s", since: 2, tip: "Siddende i maskine med ryggen mod puden. Let vægt, ingen failure.",
        phases: [{ sets: 2, reps: "10" }, { sets: 2, reps: "10" }, { sets: 3, reps: "8-12" }] },
      { id: "cable_curl", name: "Bicepscurl (kabel)", rest: "90s", since: 2, tip: "Albuerne ind til kroppen og roligt tempo. Let modstand.",
        phases: [{ sets: 2, reps: "12" }, { sets: 2, reps: "12" }, { sets: 3, reps: "10-12" }] }
    ]
  }
];

const DAYS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
export const sessionById = id => SESSIONS.find(s => s.id === id) || null;
export const sessionByLetter = l => SESSIONS.find(s => s.letter === l) || null;

// Øvelser med sæt/reps for den valgte uge
export function sessionForWeek(id, week) {
  const s = sessionById(id);
  if (!s) return null;
  const ph = phaseOfWeek(week);
  return {
    ...s,
    week: Math.min(Math.max(Math.round(Number(week) || 1), 1), COMEBACK_WEEKS),
    optional: !!s.fromWeek && (Number(week) || 1) < s.fromWeek,
    exercises: s.exercises.map(ex => ({
      id: ex.id, name: ex.name, rest: ex.rest, tip: ex.tip, unit: ex.unit, isTime: ex.isTime, since: ex.since || 1,
      sets: ex.phases[ph].sets, reps: ex.phases[ph].reps
    }))
  };
}

// ── Kondition ─────────────────────────────────────────────────────────────────
// Først fra uge 3, og kun hvis den lettere træning tolereres symptomfrit.
const CARDIO = {
  3: { minutes: 20, label: "20 min", segments: "5 min let + 10 min jævnt + 5 min let" },
  4: { minutes: 25, label: "25 min", segments: "5 min let + 15 min jævnt + 5 min let" },
  5: { minutes: 30, label: "30 min", segments: "5 min let + 20 min jævnt + 5 min let" },
  6: { minutes: 35, label: "30–35 min", segments: "5 min let + 20–25 min jævnt + 5 min let" }
};
export function cardioForWeek(week) {
  const w = Math.round(Number(week) || 0);
  return CARDIO[w] ? { week: w, ...CARDIO[w] } : null;
}

// ── Ugeplan ───────────────────────────────────────────────────────────────────
const LOAD = [
  "RPE 5–6 — hold mindst ca. 4 gentagelser i reserve. Teknik før belastning.",
  "Samme niveau som uge 1. Fokus på teknik og på at komme i gang igen.",
  "RPE 5–6. Kun fremgang hvis du har været symptomfri. Tredje sæt er valgfrit.",
  "RPE 6. Intet pres mod failure. Tredje sæt er valgfrit.",
  "RPE 6–7 hvis restitutionen er god. Tre sæt på de store øvelser.",
  "RPE 6–7. Tre sæt. Brug ugen til at vurdere næste fase."
];
export const loadForWeek = week =>
  LOAD[Math.min(Math.max(Math.round(Number(week) || 1), 1), COMEBACK_WEEKS) - 1];

// Dagene i ugen: mandag A, onsdag C (fra uge 3), fredag B
export function weekPlan(week) {
  const w = Math.min(Math.max(Math.round(Number(week) || 1), 1), COMEBACK_WEEKS);
  return SESSIONS.map(s => ({
    day: s.day,
    dayName: DAYS[s.day],
    id: s.id, letter: s.letter, name: s.name,
    optional: !!s.fromWeek && w < s.fromWeek,
    cardio: !!s.cardio,
    detail: s.cardio ? (cardioForWeek(w)?.label || "Hviledag i uge 1–2")
      : sessionForWeek(s.id, w).exercises.length + " øvelser · " +
        sessionForWeek(s.id, w).exercises[0].sets + " sæt"
  })).sort((a, b) => a.day - b.day);
}

// Ugeplanen som appens dag→program-kort. Uge 1–2 lader onsdag stå tom, så
// konditionspasset ikke ligner et krav før det er relevant.
export function splitForWeek(week) {
  const w = Math.min(Math.max(Math.round(Number(week) || 1), 1), COMEBACK_WEEKS);
  const split = {};
  SESSIONS.forEach(s => { if (!s.fromWeek || w >= s.fromWeek) split[s.day] = s.id; });
  return split;
}

// ── Sæt pr. uge, som brugeren selv godkender ──────────────────────────────────
// Returnerer kun ændringer for de øvelser programmet selv har lagt ind, så egne
// øvelser, vægte og rettelser bliver stående.
export function weekSetUpdates(week) {
  const ph = phaseOfWeek(week);
  const out = {};
  SESSIONS.forEach(s => {
    out[s.id] = {};
    s.exercises.forEach(ex => { out[s.id][ex.id] = { sets: ex.phases[ph].sets, reps: ex.phases[ph].reps }; });
  });
  return out;
}

// ── Seed ──────────────────────────────────────────────────────────────────────
// Programdokumenter som de skal gemmes første gang: uge 1-ordination, ingen
// vægte. lookup(id) henter navn/maskine/muskler fra appens øvelseskatalog.
export function programDocs(lookup, week = 1) {
  return SESSIONS.map(s => {
    const prescribed = sessionForWeek(s.id, week);
    return {
      id: s.id,
      name: s.name,
      color: s.color,
      desc: s.desc,
      comebackKey: COMEBACK_KEY,
      comebackVersion: COMEBACK.version,
      exercises: prescribed.exercises.map(ex => {
        const cat = (lookup && lookup(ex.id)) || {};
        return {
          id: ex.id,
          name: ex.name || cat.name || ex.id,
          machine: cat.machine || "",
          muscles: cat.muscles || "",
          tip: ex.tip || cat.tip || "",
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          ...(ex.isTime ? { isTime: true } : {}),
          ...(ex.unit ? { unit: ex.unit } : {})
        };
      })
    };
  });
}

// Findes programmet allerede? Bruges til at holde seed idempotent.
export const isComebackProgram = prog => !!prog && prog.comebackKey === COMEBACK_KEY;
export const comebackProgramIds = () => SESSIONS.map(s => s.id);

// Programmer gemt før version 2 mangler skulder- og armøvelserne. Kun øvelser, der
// er kommet til siden programmets gemte version, tilføjes — aldrig noget der er slettet.
export function exercisesToAdd(prog, lookup, week = 1) {
  if (!isComebackProgram(prog)) return [];
  const saved = Number(prog.comebackVersion) || 1;
  const have = new Set((prog.exercises || []).map(e => e.id));
  const s = sessionForWeek(prog.id || "", week) || SESSIONS.find(x => x.name === prog.name);
  if (!s) return [];
  return s.exercises.filter(ex => (ex.since || 1) > saved && !have.has(ex.id)).map(ex => {
    const cat = (lookup && lookup(ex.id)) || {};
    return {
      id: ex.id, name: ex.name || cat.name || ex.id, machine: cat.machine || "", muscles: cat.muscles || "",
      tip: ex.tip || cat.tip || "", sets: ex.sets, reps: ex.reps, rest: ex.rest
    };
  });
}

// Hvad "læg ugen i min plan" ændrer i forhold til den nuværende plan, så knappen kan
// vise det før noget overskrives. current: {dag: programnøgle}, labelOf: nøgle → navn.
export function planChanges(week, current, labelOf = x => x) {
  const target = splitForWeek(week);
  const out = [];
  SESSIONS.forEach(s => {
    const from = current && current[s.day] || null;
    const to = target[s.day] || null;
    if (to && from !== to) out.push({ day: s.day, dayName: DAYS[s.day], from: from && labelOf(from), to: labelOf(to) });
    if (!to && from === s.id) out.push({ day: s.day, dayName: DAYS[s.day], from: labelOf(from), to: null });
  });
  return out;
}
