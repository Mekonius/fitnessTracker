// Kør med: node --test "tests/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMEBACK, COMEBACK_KEY, COMEBACK_WEEKS, SESSIONS, phaseOfWeek, sessionById,
  sessionByLetter, sessionForWeek, cardioForWeek, loadForWeek, weekPlan,
  splitForWeek, weekSetUpdates, programDocs, isComebackProgram, comebackProgramIds,
  exercisesToAdd, planChanges
} from "../comeback.js";

// ── Programmets identitet ─────────────────────────────────────────────────────
test("programmet har ét stabilt id og et dansk navn", () => {
  assert.equal(COMEBACK_KEY, "athletic-comeback-falktoft-6w");
  assert.equal(COMEBACK.name, "Athletic Comeback – Falktoft-inspireret");
  assert.equal(COMEBACK.version, 2);
  assert.equal(COMEBACK_WEEKS, 6);
});
test("de tre pas har hver sit stabile id afledt af nøglen", () => {
  assert.deepEqual(comebackProgramIds(), [
    "athletic-comeback-falktoft-6w_a",
    "athletic-comeback-falktoft-6w_c",
    "athletic-comeback-falktoft-6w_b"
  ]);
  assert.equal(new Set(comebackProgramIds()).size, 3);
});
test("passene ligger mandag, onsdag og fredag", () => {
  assert.equal(sessionByLetter("A").day, 1);
  assert.equal(sessionByLetter("C").day, 3);
  assert.equal(sessionByLetter("B").day, 5);
});

// ── Faser og uger ─────────────────────────────────────────────────────────────
test("uge 1–2, 3–4 og 5–6 deler ordination", () => {
  assert.equal(phaseOfWeek(1), 0);
  assert.equal(phaseOfWeek(2), 0);
  assert.equal(phaseOfWeek(3), 1);
  assert.equal(phaseOfWeek(4), 1);
  assert.equal(phaseOfWeek(5), 2);
  assert.equal(phaseOfWeek(6), 2);
});
test("uger uden for 1–6 klemmes ind i intervallet", () => {
  assert.equal(phaseOfWeek(0), 0);
  assert.equal(phaseOfWeek(99), 2);
  assert.equal(phaseOfWeek(undefined), 0);
});

// ── Progression i sæt ─────────────────────────────────────────────────────────
test("uge 1 giver 2 arbejdssæt på alle styrkeøvelser", () => {
  ["A", "B"].forEach(l => {
    sessionForWeek(sessionByLetter(l).id, 1).exercises
      .forEach(ex => assert.equal(ex.sets, 2, l + "/" + ex.id));
  });
});
test("uge 3–4 holder 2 sæt — det tredje er valgfrit, ikke påtvunget", () => {
  sessionForWeek(sessionByLetter("A").id, 3).exercises
    .forEach(ex => assert.equal(ex.sets, 2));
  assert.match(loadForWeek(3), /valgfrit/);
  assert.match(loadForWeek(4), /valgfrit/);
});
test("uge 5 giver 3 sæt på styrkeøvelserne", () => {
  ["A", "B"].forEach(l => {
    sessionForWeek(sessionByLetter(l).id, 5).exercises
      .forEach(ex => assert.equal(ex.sets, 3, l + "/" + ex.id));
  });
});
test("uge 6 ligger på samme fase som uge 5", () => {
  const u5 = sessionForWeek(sessionByLetter("B").id, 5).exercises;
  const u6 = sessionForWeek(sessionByLetter("B").id, 6).exercises;
  assert.deepEqual(u6, u5);
});
test("belastningsteksten findes for alle seks uger og nævner RPE", () => {
  for (let w = 1; w <= 6; w++) assert.match(loadForWeek(w), /RPE|teknik/i);
});

// ── Kondition ─────────────────────────────────────────────────────────────────
test("kondition starter først i uge 3", () => {
  assert.equal(cardioForWeek(1), null);
  assert.equal(cardioForWeek(2), null);
  assert.equal(cardioForWeek(3).minutes, 20);
});
test("konditionen vokser roligt fra 20 til 35 min", () => {
  assert.equal(cardioForWeek(4).minutes, 25);
  assert.equal(cardioForWeek(5).minutes, 30);
  assert.equal(cardioForWeek(6).minutes, 35);
  assert.equal(cardioForWeek(6).label, "30–35 min");
  for (let w = 3; w <= 6; w++) assert.match(cardioForWeek(w).segments, /let/);
});
test("konditionspasset logges i minutter, ikke i kilo eller reps", () => {
  const c = sessionForWeek(sessionByLetter("C").id, 3);
  assert.equal(c.exercises.length, 1);
  assert.equal(c.exercises[0].isTime, true);
  assert.equal(c.exercises[0].unit, "MIN");
  assert.equal(c.exercises[0].sets, 1);
  assert.equal(c.exercises[0].reps, "20 min");
});
test("konditionspasset er markeret valgfrit i uge 1–2", () => {
  assert.equal(sessionForWeek(sessionByLetter("C").id, 1).optional, true);
  assert.equal(sessionForWeek(sessionByLetter("C").id, 3).optional, false);
  assert.equal(sessionForWeek(sessionByLetter("A").id, 1).optional, false);
});

// ── Ugeplan ───────────────────────────────────────────────────────────────────
test("ugeplanen viser tre dage i rækkefølge", () => {
  const p = weekPlan(5);
  assert.deepEqual(p.map(d => d.dayName), ["Mandag", "Onsdag", "Fredag"]);
  assert.deepEqual(p.map(d => d.letter), ["A", "C", "B"]);
});
test("uge 1–2 lægger kun A og B i planen", () => {
  assert.deepEqual(Object.values(splitForWeek(1)), [
    sessionByLetter("A").id, sessionByLetter("B").id
  ]);
  assert.equal(Object.keys(splitForWeek(1)).length, 2);
  assert.equal(weekPlan(1).find(d => d.letter === "C").optional, true);
});
test("fra uge 3 kommer konditionspasset med i planen", () => {
  const s = splitForWeek(3);
  assert.equal(Object.keys(s).length, 3);
  assert.equal(s[3], sessionByLetter("C").id);
  assert.equal(weekPlan(3).find(d => d.letter === "C").detail, "20 min");
});

// ── Seed ──────────────────────────────────────────────────────────────────────
const KATALOG = {
  leg_press: { name: "Benpres", machine: "Benpres maskine", muscles: "Quadriceps + glutes", tip: "katalog-tip" },
  pallof_press: { name: "Pallof Press", machine: "Kabeltårn", muscles: "Core" }
};
test("seed bygger tre programmer med navne fra øvelseskataloget", () => {
  const docs = programDocs(id => KATALOG[id]);
  assert.equal(docs.length, 3);
  assert.deepEqual(docs.map(d => d.id), comebackProgramIds());
  const a = docs.find(d => d.id.endsWith("_a"));
  assert.equal(a.name, "Comeback A · Fundament");
  assert.equal(a.exercises[0].name, "Benpres (maskine)");   // programmets danske navn vinder
  assert.equal(a.exercises[0].machine, "Benpres maskine");   // udstyret kommer fra kataloget
});
test("alle øvelser har et dansk visningsnavn", () => {
  SESSIONS.forEach(s => s.exercises.forEach(ex =>
    assert.ok(ex.name && ex.name.length > 2, s.letter + "/" + ex.id + " mangler navn")));
  const docs = programDocs(() => ({}));
  docs.forEach(d => d.exercises.forEach(ex => assert.notEqual(ex.name, ex.id)));
});
test("programmets eget tip vinder over katalogets", () => {
  const a = programDocs(id => KATALOG[id]).find(d => d.id.endsWith("_a"));
  assert.match(a.exercises[0].tip, /Kontrolleret dybde/);
});
test("seed forudfylder hverken vægte, puls eller distance", () => {
  programDocs(id => KATALOG[id]).forEach(d => d.exercises.forEach(ex => {
    assert.ok(!("weight" in ex) && !("kg" in ex) && !("distance" in ex) && !("hr" in ex),
      "ingen fabrikerede værdier i " + ex.id);
  }));
});
test("seed starter på uge 1-ordinationen", () => {
  const a = programDocs(id => KATALOG[id]).find(d => d.id.endsWith("_a"));
  a.exercises.forEach(ex => assert.equal(ex.sets, 2));
});
test("konditionspasset seedes som tidsøvelse i minutter", () => {
  const c = programDocs(id => KATALOG[id]).find(d => d.id.endsWith("_c"));
  assert.equal(c.exercises.length, 1);
  assert.equal(c.exercises[0].isTime, true);
  assert.equal(c.exercises[0].unit, "MIN");
});
test("programmerne kan genkendes på nøglen, så genimport ikke laver dubletter", () => {
  const docs = programDocs(id => KATALOG[id]);
  docs.forEach(d => assert.equal(isComebackProgram(d), true));
  assert.equal(isComebackProgram({ name: "Mit eget program" }), false);
  assert.equal(isComebackProgram(null), false);
  // Samme seed to gange giver samme id'er — ikke nye
  assert.deepEqual(programDocs(id => KATALOG[id]).map(d => d.id), docs.map(d => d.id));
});

// ── Ugeopdatering som brugeren selv godkender ─────────────────────────────────
test("ugeopdatering rører kun programmets egne øvelser", () => {
  const upd = weekSetUpdates(5);
  const a = sessionByLetter("A");
  assert.deepEqual(Object.keys(upd[a.id]), a.exercises.map(e => e.id));
  assert.equal(upd[a.id].leg_press.sets, 3);
  assert.equal(upd[a.id].leg_press.reps, "8-12");
  assert.equal(upd[a.id].fremmed_øvelse, undefined);
});
test("ugeopdatering til uge 1 fører tilbage til 2 sæt", () => {
  const upd = weekSetUpdates(1);
  assert.equal(upd[sessionByLetter("B").id].lat_pulldown.sets, 2);
});

// ── Sikkerhed ─────────────────────────────────────────────────────────────────
test("sikkerhedsnoten nævner lægen og symptomerne man skal stoppe ved", () => {
  assert.match(COMEBACK.safety, /lægens vurdering/);
  assert.match(COMEBACK.safety, /ørhed/);
  assert.match(COMEBACK.safety, /brystsmerter/);
  assert.match(COMEBACK.emergency, /112/);
});
test("programmet lover ikke lægelig godkendelse", () => {
  const tekst = [COMEBACK.desc, COMEBACK.safety, COMEBACK.emergency].join(" ").toLowerCase();
  ["godkendt til træning", "du er rask", "ufarligt", "diagnose"].forEach(f =>
    assert.ok(!tekst.includes(f), "må ikke love: " + f));
});
test("ingen øvelser der kræver spotter, maks-test eller høj faldrisiko", () => {
  const forbudt = ["bench_press", "barbell_squat", "deadlift", "box_jump", "burpee", "thruster", "rope_jump"];
  SESSIONS.forEach(s => s.exercises.forEach(ex =>
    assert.ok(!forbudt.includes(ex.id), s.letter + " må ikke indeholde " + ex.id)));
});
test("ingen intervaller eller HIIT i konditionspasset", () => {
  const c = sessionByLetter("C");
  assert.match(c.exercises[0].tip, /Ingen intervaller/);
  assert.match(c.desc, /Taletesten/);
});
test("alle pas har opvarmning og nedkøling", () => {
  SESSIONS.forEach(s => {
    assert.ok(s.warmup && s.warmup.length > 10, s.letter + " mangler opvarmning");
    assert.ok(s.cooldown && s.cooldown.length > 10, s.letter + " mangler nedkøling");
  });
});
test("hvert pas har mindst tre øvelser og rimelige pauser", () => {
  SESSIONS.filter(s => !s.cardio).forEach(s => {
    assert.ok(s.exercises.length >= 3, s.letter);
    s.exercises.forEach(ex => assert.match(ex.rest, /^\d+s$/));
  });
});

// ── Skulder og arme ───────────────────────────────────────────────────────────
test("programmet har direkte skulder-, triceps- og bicepsarbejde", () => {
  const ids = SESSIONS.flatMap(s => s.exercises.map(e => e.id));
  ["shoulder_press", "tricep_pushdown", "cable_curl"].forEach(id => assert.ok(ids.includes(id), id));
});
test("de nye øvelser starter også på 2 sæt i uge 1–2", () => {
  ["A", "B"].forEach(l => sessionForWeek(sessionByLetter(l).id, 1).exercises
    .forEach(ex => assert.equal(ex.sets, 2, l + "/" + ex.id)));
});
test("nye programmer seedes med alle øvelser og nuværende version", () => {
  const docs = programDocs(() => ({}));
  assert.equal(docs.find(d => d.id.endsWith("_b")).exercises.length, 7);
  docs.forEach(d => assert.equal(d.comebackVersion, 2));
  docs.forEach(d => assert.deepEqual(exercisesToAdd(d, () => ({})), []));
});
test("gamle programmer får kun de nye øvelser — ikke noget brugeren har slettet", () => {
  const v1 = programDocs(() => ({}), 1).find(d => d.id.endsWith("_b"));
  v1.comebackVersion = 1;
  v1.exercises = v1.exercises.filter(e => e.id !== "shoulder_press" && e.id !== "cable_curl" && e.id !== "dead_bug");
  const add = exercisesToAdd(v1, () => ({}), 1);
  assert.deepEqual(add.map(e => e.id), ["shoulder_press", "cable_curl"]);   // dead_bug er fra v1 og kommer ikke tilbage
  add.forEach(e => assert.equal(e.sets, 2));
});
test("fremmede programmer får aldrig tilføjet noget", () => {
  assert.deepEqual(exercisesToAdd({ name: "Mit eget", exercises: [] }, () => ({})), []);
});

// ── Hvad planknappen ændrer ───────────────────────────────────────────────────
test("planChanges viser hvilke dage der bliver erstattet", () => {
  const a = sessionByLetter("A").id, b = sessionByLetter("B").id;
  const ch = planChanges(1, { 1: "HELKROP", 3: "OVERKROP", 5: "MOBIL" });
  assert.deepEqual(ch.map(c => [c.dayName, c.from, c.to]), [["Mandag", "HELKROP", a], ["Fredag", "MOBIL", b]]);
});
test("planChanges rører ikke onsdag i uge 1–2 hvis den er en anden plan", () => {
  assert.ok(!planChanges(1, { 3: "OVERKROP" }).some(c => c.day === 3));
});
test("planChanges melder at konditionspasset fjernes fra onsdag i uge 1–2", () => {
  const c = sessionByLetter("C").id;
  const ch = planChanges(1, { 3: c }, x => x).filter(x => x.day === 3);
  assert.deepEqual(ch, [{ day: 3, dayName: "Onsdag", from: c, to: null }]);
});
test("planChanges er tom når planen allerede passer", () => {
  assert.deepEqual(planChanges(3, splitForWeek(3)), []);
});
test("planChanges bruger labelOf til visningsnavne", () => {
  const ch = planChanges(3, { 1: "HELKROP" }, x => x.toLowerCase());
  assert.equal(ch.find(c => c.day === 1).from, "helkrop");
});
