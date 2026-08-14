// Kør med: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bmr, activityFactor, AF_MAX, tdee, calorieTarget, proteinTarget, fiberTarget,
  expectedWeeklyChange, entriesFromMap, weightTrend, weeklyRate,
  recommendedAdjustment, recompSignal, strengthChangePct, plan
} from "../nutrition.js";

// ── BMR (Mifflin-St Jeor) ─────────────────────────────────────────────────────
test("BMR kvinde", () => {
  // 10*81.7 + 6.25*158 - 5*41 - 161 = 1438.5 → 1439
  assert.equal(bmr({ sex: "female", weightKg: 81.7, heightCm: 158, age: 41 }), 1439);
});
test("BMR mand", () => {
  // 10*85 + 6.25*182 - 5*38 + 5 = 1802.5 → 1803
  assert.equal(bmr({ sex: "male", weightKg: 85, heightCm: 182, age: 38 }), 1803);
});
test("BMR mand er 166 kcal højere end kvinde ved samme krop", () => {
  const a = { weightKg: 70, heightCm: 170, age: 30 };
  assert.equal(bmr({ ...a, sex: "male" }) - bmr({ ...a, sex: "female" }), 166);
});
test("BMR falder med alderen", () => {
  const y = bmr({ sex: "female", weightKg: 70, heightCm: 170, age: 25 });
  const o = bmr({ sex: "female", weightKg: 70, heightCm: 170, age: 65 });
  assert.equal(y - o, 200); // 5 kcal pr. år
});
test("BMR kræver komplette input", () => {
  assert.equal(bmr({ sex: "female", weightKg: 0, heightCm: 158, age: 41 }), null);
  assert.equal(bmr({}), null);
  assert.equal(bmr(), null);
});
test("BMR accepterer komma-tal fra input-felter", () => {
  assert.equal(bmr({ sex: "female", weightKg: "81,7", heightCm: "158", age: "41" }), 1439);
});

// ── Aktivitetsfaktor ──────────────────────────────────────────────────────────
test("aktivitetsfaktor følger skridt-trapperne", () => {
  assert.equal(activityFactor({ steps: 3000, sessionsPerWeek: 0 }), 1.25);
  assert.equal(activityFactor({ steps: 5000, sessionsPerWeek: 0 }), 1.35);
  assert.equal(activityFactor({ steps: 7000, sessionsPerWeek: 0 }), 1.45);
  assert.equal(activityFactor({ steps: 9000, sessionsPerWeek: 0 }), 1.55);
  assert.equal(activityFactor({ steps: 12000, sessionsPerWeek: 0 }), 1.65);
});
test("styrketræning giver et lille tillæg", () => {
  assert.equal(activityFactor({ steps: 7000, sessionsPerWeek: 2 }), 1.48);
  assert.equal(activityFactor({ steps: 7000, sessionsPerWeek: 4 }), 1.51);
  assert.equal(activityFactor({ steps: 7000, sessionsPerWeek: 6 }), 1.53);
});
test("aktivitetsfaktor har et loft", () => {
  assert.equal(activityFactor({ steps: 25000, sessionsPerWeek: 7 }), 1.73); // højeste trappe + største tillæg
  assert.ok(activityFactor({ steps: 99999, sessionsPerWeek: 14 }) <= AF_MAX);
});
test("meget lav aktivitet giver stadig en brugbar faktor", () => {
  assert.equal(activityFactor({ steps: 0, sessionsPerWeek: 0 }), 1.25);
  assert.equal(activityFactor({}), 1.25);
});

// ── TDEE ──────────────────────────────────────────────────────────────────────
test("TDEE = BMR × aktivitetsfaktor", () => {
  const i = { sex: "female", weightKg: 81.7, heightCm: 158, age: 41, steps: 7000, sessionsPerWeek: 2 };
  assert.equal(tdee(i), Math.round(bmr(i) * activityFactor(i)));
});
test("TDEE er null uden komplette input", () => assert.equal(tdee({ steps: 7000 }), null));

// ── Kaloriemål pr. mål ────────────────────────────────────────────────────────
test("fedttab er ca. 15 % under vedligehold", () => {
  const t = calorieTarget({ tdee: 2100, goal: "fatloss", sex: "female", bmr: 1439 });
  assert.equal(t.kcal, 1790);
  assert.equal(t.deficit, 310);
  assert.equal(t.warning, null);
});
test("recomposition er ca. 10 % under vedligehold", () => {
  const t = calorieTarget({ tdee: 2100, goal: "recomp", sex: "female", bmr: 1439 });
  assert.equal(t.kcal, 1890);
  assert.equal(t.deficit, 210);
});
test("vedligeholdelse rammer TDEE", () => {
  const t = calorieTarget({ tdee: 2100, goal: "maintain", sex: "female" });
  assert.equal(t.kcal, 2100);
  assert.equal(t.deficit, 0);
});
test("muskelopbygning er et lille overskud, ikke en bulk", () => {
  const t = calorieTarget({ tdee: 2100, goal: "muscle", sex: "male" });
  assert.ok(t.kcal > 2100 && t.kcal <= 2100 * 1.1, "overskud skal ligge inden for 5–10 %");
  assert.ok(t.deficit < 0);
});
test("ukendt mål falder tilbage til recomposition", () => {
  assert.equal(calorieTarget({ tdee: 2000, goal: "hokuspokus" }).goal, "recomp");
});
test("intet TDEE giver intet mål", () => assert.equal(calorieTarget({ tdee: null, goal: "fatloss" }), null));

// ── Sikkerhedsgrænser ─────────────────────────────────────────────────────────
test("meget lavt mål holdes på gulvet og advarer", () => {
  const t = calorieTarget({ tdee: 1300, goal: "fatloss", sex: "female", bmr: 1150 });
  assert.equal(t.raw, 1110);
  assert.equal(t.kcal, 1200);
  assert.equal(t.floored, true);
  assert.match(t.warning, /meget lavt mål/);
});
test("mænd har et højere gulv end kvinder", () => {
  const t = calorieTarget({ tdee: 1600, goal: "fatloss", sex: "male", bmr: 1400 });
  assert.equal(t.kcal, 1500);
  assert.equal(t.floored, true);
});
test("mål under hvilestofskiftet advarer også", () => {
  const t = calorieTarget({ tdee: 1900, goal: "fatloss", sex: "female", bmr: 1700 });
  assert.equal(t.floored, false);
  assert.match(t.warning, /hvilestofskifte/);
});

// ── Protein ───────────────────────────────────────────────────────────────────
test("protein er ca. 1,6 g/kg med interval 1,4–1,8", () => {
  const p = proteinTarget({ weightKg: 81.7 });
  assert.equal(p.target, 130);
  assert.equal(p.min, 115);
  assert.equal(p.max, 145);
  assert.ok(p.target > p.min && p.target < p.max);
});
test("protein tæller kilo over 90 halvt, så tunge brugere ikke får ekstreme mål", () => {
  const p = proteinTarget({ weightKg: 140 });
  assert.equal(p.refKg, 115);
  assert.ok(p.target / 140 < 1.4, "under 1,4 g pr. faktisk kg ved 140 kg");
  assert.ok(p.target >= 180, "men stadig et højt absolut mål");
});
test("protein er lineært under 90 kg", () => {
  assert.equal(proteinTarget({ weightKg: 60 }).target, 95);  // 1,6 × 60 = 96 → 95
  assert.equal(proteinTarget({ weightKg: 90 }).refKg, 90);
});
test("protein kræver en vægt", () => assert.equal(proteinTarget({ weightKg: 0 }), null));

// ── Fibre ─────────────────────────────────────────────────────────────────────
test("fibre er 14 g pr. 1000 kcal inden for 25–35 g", () => {
  assert.equal(fiberTarget(2100), 29);
  assert.equal(fiberTarget(1400), 25);  // 19,6 → gulv
  assert.equal(fiberTarget(3500), 35);  // 49 → loft
});
test("fibre kræver et kaloriebehov", () => assert.equal(fiberTarget(0), null));

// ── Forventet ugentlig ændring ────────────────────────────────────────────────
test("forventet vægtændring er et interval, ikke en dato", () => {
  const e = expectedWeeklyChange("fatloss");
  assert.ok(e.minKg < 0 && e.maxKg < 0);
  assert.match(e.text, /roligt vægttab/);
  assert.doesNotMatch(e.text, /\d{1,2}\. \w+/); // ingen datoløfter
  assert.ok(expectedWeeklyChange("muscle").minKg > 0);
  assert.equal(expectedWeeklyChange("maintain").maxKg, 0.15);
});

// ── Vægtdata og trend ─────────────────────────────────────────────────────────
test("urealistiske vægte og datoer sorteres fra", () => {
  const list = entriesFromMap({ "2026-01-01": 81.7, "2026-01-02": 0, "2026-01-03": 900, "ikke-en-dato": 80 });
  assert.deepEqual(list, [{ date: "2026-01-01", value: 81.7 }]);
});
test("7-dages snit sammenlignes med ugen før", () => {
  const t = weightTrend({
    "2026-03-01": 81.9, "2026-03-03": 81.6, "2026-03-05": 81.8, "2026-03-07": 81.5, // forrige uge
    "2026-03-09": 81.4, "2026-03-11": 81.2, "2026-03-13": 81.3, "2026-03-14": 81.3  // denne uge
  });
  assert.equal(t.ready, true);
  assert.equal(t.avg, 81.3);
  assert.equal(t.prevAvg, 81.7);
  assert.equal(t.change, -0.4);
  assert.equal(t.latest, 81.3);
  assert.equal(t.latestDate, "2026-03-14");
});
test("én enkelt måling giver ingen ændring at vise", () => {
  const t = weightTrend({ "2026-03-14": 81.3 });
  assert.equal(t.ready, true);
  assert.equal(t.avg, 81.3);
  assert.equal(t.prevAvg, null);
  assert.equal(t.change, null);
});
test("manglende vægtdata giver et tomt, ikke-crashende svar", () => {
  const t = weightTrend({});
  assert.equal(t.ready, false);
  assert.equal(t.points, 0);
  assert.equal(t.change, null);
  assert.equal(weightTrend([]).ready, false);
});
test("en enkelt outlier flytter ikke ugesnittet meget", () => {
  const base = { "2026-03-09": 81.3, "2026-03-11": 81.3, "2026-03-12": 81.3, "2026-03-13": 81.3, "2026-03-14": 81.3 };
  const clean = weightTrend(base).avg;
  const spiked = weightTrend({ ...base, "2026-03-10": 83.1 }).avg; // saltet aftensmad
  assert.ok(Math.abs(spiked - clean) <= 0.3, "outlier må højst rykke snittet 0,3 kg");
});

// ── Ugentlig rate (grundlag for adaptivt mål) ─────────────────────────────────
test("ugerate kræver mindst ~3 ugers data", () => {
  assert.equal(weeklyRate({ "2026-03-01": 82, "2026-03-08": 81.6 }), null);
  assert.equal(weeklyRate({ "2026-03-01": 82, "2026-03-05": 81.9, "2026-03-10": 81.7, "2026-03-14": 81.6 }), null);
});
test("ugerate måles over tre uger", () => {
  const r = weeklyRate({
    "2026-03-01": 82.0, "2026-03-03": 82.0,           // uge 1
    "2026-03-08": 81.8, "2026-03-10": 81.6,           // uge 2
    "2026-03-15": 81.5, "2026-03-17": 81.3,           // uge 3
    "2026-03-20": 81.2, "2026-03-22": 81.0            // uge 3-4
  });
  assert.ok(r, "der skal være en rate");
  assert.ok(r.kgPerWeek < 0, "vægten falder");
  assert.ok(r.spanDays >= 18);
  assert.equal(r.points, 8);
});

// ── Adaptivt kaloriemål ───────────────────────────────────────────────────────
test("stabil vægt på fedttab foreslår en lille nedjustering", () => {
  const a = recommendedAdjustment({ goal: "fatloss", calorieTarget: 1750, sex: "female", rate: { kgPerWeek: 0, spanDays: 21, points: 9 } });
  assert.equal(a.direction, "down");
  assert.equal(a.to, 1650);
  assert.equal(a.from, 1750);
  assert.match(a.reason, /stabil de seneste 3 uger/);
});
test("for hurtigt vægttab foreslår at spise lidt mere", () => {
  const a = recommendedAdjustment({ goal: "fatloss", calorieTarget: 1750, sex: "female", rate: { kgPerWeek: -1.3, spanDays: 21, points: 9 } });
  assert.equal(a.direction, "up");
  assert.equal(a.to, 1900);
  assert.match(a.reason, /hurtigere end nødvendigt/);
});
test("trend inden for det forventede giver ingen ændring", () => {
  assert.equal(recommendedAdjustment({ goal: "fatloss", calorieTarget: 1750, sex: "female", rate: { kgPerWeek: -0.5, spanDays: 21, points: 9 } }), null);
  assert.equal(recommendedAdjustment({ goal: "recomp", calorieTarget: 1890, sex: "female", rate: { kgPerWeek: -0.2, spanDays: 25, points: 12 } }), null);
});
test("justeringer er små — 100 eller 150 kcal", () => {
  const mild = recommendedAdjustment({ goal: "recomp", calorieTarget: 1890, sex: "female", rate: { kgPerWeek: 0.1, spanDays: 21, points: 9 } });
  const langt = recommendedAdjustment({ goal: "recomp", calorieTarget: 1890, sex: "female", rate: { kgPerWeek: 0.6, spanDays: 21, points: 9 } });
  assert.equal(mild.delta, -100);
  assert.equal(langt.delta, -150);
});
test("justering foreslås aldrig ned under sikkerhedsgulvet", () => {
  assert.equal(recommendedAdjustment({ goal: "fatloss", calorieTarget: 1250, sex: "female", rate: { kgPerWeek: 0, spanDays: 21, points: 9 } }), null);
});
test("for lidt data giver intet forslag", () => {
  assert.equal(recommendedAdjustment({ goal: "fatloss", calorieTarget: 1750, entries: { "2026-03-01": 82, "2026-03-08": 82 } }), null);
  assert.equal(recommendedAdjustment({ goal: "fatloss", calorieTarget: null, rate: { kgPerWeek: 0, spanDays: 21, points: 9 } }), null);
});

// ── Styrke/volumen-trend ──────────────────────────────────────────────────────
test("volumen-trend sammenligner 14 dage med de 14 dage før", () => {
  const e = [
    { date: "2026-02-16", value: 4000 }, { date: "2026-02-20", value: 4000 }, // tidligere periode
    { date: "2026-03-02", value: 4400 }, { date: "2026-03-06", value: 4400 }  // seneste periode
  ];
  assert.equal(strengthChangePct(e), 10);
});
test("volumen-trend kræver data i begge perioder", () => {
  assert.equal(strengthChangePct([{ date: "2026-03-02", value: 4400 }]), null);
  assert.equal(strengthChangePct([]), null);
});

// ── Body recomposition-signal ─────────────────────────────────────────────────
test("stabil vægt + faldende talje kan være tegn på recomposition", () => {
  const s = recompSignal({ weightChangeKg: -0.1, waistChangeCm: -1.5 });
  assert.match(s.text, /kan være tegn på body recomposition/);
  assert.doesNotMatch(s.text, /har bygget muskel/);
});
test("stigende styrke nævnes med i signalet", () => {
  const s = recompSignal({ weightChangeKg: 0.2, waistChangeCm: -1, strengthChangePct: 6 });
  assert.match(s.text, /styrke/);
});
test("intet signal uden talje- eller vægtdata, eller når vægten flytter sig", () => {
  assert.equal(recompSignal({ weightChangeKg: -0.1 }), null);
  assert.equal(recompSignal({ waistChangeCm: -2 }), null);
  assert.equal(recompSignal({ weightChangeKg: -1.2, waistChangeCm: -2 }), null);
  assert.equal(recompSignal({ weightChangeKg: 0, waistChangeCm: 0 }), null);
});

// ── Sanity check: eksempelpersonen fra kravene ────────────────────────────────
test("eksempelperson: kvinde, 41 år, 158 cm, 81,7 kg, 7.000 skridt, 2 træninger, recomposition", () => {
  const p = plan({ sex: "female", age: 41, heightCm: 158, weightKg: 81.7, steps: 7000, sessionsPerWeek: 2, goal: "recomp" });
  assert.ok(Math.abs(p.bmr - 1440) <= 5, "BMR omkring 1.440, fik " + p.bmr);
  assert.ok(p.tdee >= 2000 && p.tdee <= 2200, "TDEE 2.000–2.200, fik " + p.tdee);
  // Recomposition = TDEE − 10 % som specificeret → 1.920 kcal. Bemærk at det
  // ligger over sanity-intervallet 1.700–1.850, som svarer til ca. −15 % —
  // altså fedttabs-satsen. Formlen vinder over eksempeltallet.
  assert.equal(p.calorieTarget, 1920);
  const fedttab = plan({ sex: "female", age: 41, heightCm: 158, weightKg: 81.7, steps: 7000, sessionsPerWeek: 2, goal: "fatloss" });
  assert.ok(fedttab.calorieTarget >= 1700 && fedttab.calorieTarget <= 1850,
    "samme person på fedttab rammer 1.700–1.850, fik " + fedttab.calorieTarget);
  assert.ok(p.protein.target >= 115 && p.protein.target <= 135, "protein 115–135 g, fik " + p.protein.target);
  assert.ok(p.fiberG >= 25 && p.fiberG <= 35, "fibre 25–35 g, fik " + p.fiberG);
  assert.equal(p.warning, null);
  assert.equal(p.goal, "recomp");
  // Inputs gemmes sammen med resultatet
  assert.deepEqual(p.inputs, { sex: "female", age: 41, heightCm: 158, weightKg: 81.7, steps: 7000, sessionsPerWeek: 2, goal: "recomp" });
});
test("plan er null uden nok oplysninger", () => assert.equal(plan({ sex: "female", steps: 7000 }), null));
