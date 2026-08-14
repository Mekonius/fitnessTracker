// nutrition.js — beregninger til Kropsmål & Ernæring.
// Rene funktioner: ingen DOM, ingen Firebase. Testes af tests/nutrition.test.mjs.
// Alle tal er estimater — se README-tonen: "udgangspunkt", ikke løfter.

export const NGOALS = {
  fatloss: { label: "Fedttab", pct: -0.15, expl: "Roligt fedttab, hvor du beholder muskelmassen" },
  recomp:  { label: "Body recomposition", pct: -0.10, expl: "Langsomt fedttab med plads til at bygge muskler" },
  maintain:{ label: "Vedligeholdelse", pct: 0, expl: "Hold vægten og byg styrke" },
  muscle:  { label: "Muskelopbygning", pct: 0.07, expl: "Lille overskud — nok til vækst, ikke en bulk" }
};

// Laveste kaloriemål appen anbefaler. Under dette vises en advarsel i stedet.
const FLOOR = { male: 1500, female: 1200 };
const r10 = n => Math.round(n / 10) * 10;
const r5  = n => Math.round(n / 5) * 5;
const num = v => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : 0; };

// ── BMR: Mifflin-St Jeor ──────────────────────────────────────────────────────
export function bmr({ sex, weightKg, heightCm, age } = {}) {
  const w = num(weightKg), h = num(heightCm), a = num(age);
  if (w <= 0 || h <= 0 || a <= 0) return null;
  return Math.round(10 * w + 6.25 * h - 5 * a + (sex === "male" ? 5 : -161));
}

// ── Aktivitetsfaktor: primært skridt, lille tillæg for styrketræning ──────────
export const AF_MAX = 1.75;
export function activityFactor({ steps, sessionsPerWeek } = {}) {
  const s = num(steps), n = num(sessionsPerWeek);
  const stepF = s < 4000 ? 1.25 : s < 6500 ? 1.35 : s < 8500 ? 1.45 : s < 11000 ? 1.55 : 1.65;
  const train = n <= 0 ? 0 : n <= 2 ? 0.03 : n <= 4 ? 0.06 : 0.08;
  return Math.min(Math.round((stepF + train) * 100) / 100, AF_MAX);
}

export function tdee(input = {}) {
  const b = bmr(input);
  return b ? Math.round(b * activityFactor(input)) : null;
}

// ── Kaloriemål ────────────────────────────────────────────────────────────────
// Returnerer både det rå tal og en evt. advarsel, så UI kan vise den frem for
// blot at præsentere et meget lavt mål som normalt.
export function calorieTarget({ tdee: t, goal = "recomp", sex, bmr: b } = {}) {
  if (!t) return null;
  const g = NGOALS[goal] ? goal : "recomp";
  const raw = r10(t * (1 + NGOALS[g].pct));
  const floor = FLOOR[sex === "male" ? "male" : "female"];
  const kcal = Math.max(raw, floor);
  let warning = null;
  if (raw < floor) {
    warning = "Beregningen giver et meget lavt mål. Vi holder det på " + floor +
      " kcal som udgangspunkt — vil du lavere ned, så tag det med en læge eller diætist.";
  } else if (b && kcal < b) {
    warning = "Dit mål ligger under dit estimerede hvilestofskifte. Det kan være svært at holde over tid — " +
      "overvej et mindre underskud eller flere skridt om dagen.";
  }
  return {
    kcal, raw, floored: raw < floor, goal: g,
    deficit: Math.round(t - kcal),   // positiv = underskud, negativ = overskud
    pct: NGOALS[g].pct, warning
  };
}

// ── Protein ───────────────────────────────────────────────────────────────────
// 1,4–1,8 g/kg med 1,6 g/kg som mål. Over 90 kg tæller de ekstra kilo halvt,
// så meget tunge brugere ikke ender med urealistisk høje mål.
export function proteinTarget({ weightKg } = {}) {
  const w = num(weightKg);
  if (w <= 0) return null;
  const ref = w <= 90 ? w : 90 + (w - 90) * 0.5;
  return { target: r5(ref * 1.6), min: r5(ref * 1.4), max: r5(ref * 1.8), refKg: Math.round(ref * 10) / 10 };
}

// ── Fibre ─────────────────────────────────────────────────────────────────────
// 14 g pr. 1000 kcal af vedligeholdelsesbehovet (afhænger af kropsstørrelse,
// ikke af hvor stort et underskud man kører), holdt inden for 25–35 g.
export function fiberTarget(kcalMaintenance) {
  const k = num(kcalMaintenance);
  if (k <= 0) return null;
  return Math.min(35, Math.max(25, Math.round((14 * k) / 1000)));
}

// ── Forventet vægtændring pr. uge (interval, aldrig en dato-forudsigelse) ─────
export function expectedWeeklyChange(goal = "recomp") {
  const g = NGOALS[goal] ? goal : "recomp";
  const band = {
    fatloss:  [-0.8, -0.25], recomp: [-0.45, -0.05],
    maintain: [-0.15, 0.15], muscle: [0.05, 0.35]
  }[g];
  const [lo, hi] = band;
  const abs = n => Math.abs(n).toString().replace(".", ",");
  const text = g === "maintain"
    ? "Med dit nuværende mål svinger vægten typisk under " + abs(hi) + " kg op eller ned pr. uge."
    : g === "muscle"
      ? "Med dit nuværende mål er en rolig fremgang ofte omkring " + abs(lo) + "–" + abs(hi) + " kg om ugen."
      : "Med dit nuværende mål vil et roligt vægttab ofte være omkring " + abs(hi) + "–" + abs(lo) + " kg om ugen.";
  return { minKg: lo, maxKg: hi, text };
}

// ── Vægttrend ─────────────────────────────────────────────────────────────────
const DAY = 86400000;
const ms = ds => new Date(ds + "T12:00:00").getTime();
const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d);

// {"2026-01-01":81.7,...} → [{date,value}] sorteret, uden urealistiske tal
export function entriesFromMap(map = {}, { min = 20, max = 400 } = {}) {
  return Object.entries(map)
    .filter(([d, v]) => isDate(d) && num(v) >= min && num(v) <= max)
    .map(([date, v]) => ({ date, value: num(v) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
const asList = e => (Array.isArray(e) ? e.filter(x => x && isDate(x.date)).slice().sort((a, b) => a.date.localeCompare(b.date)) : entriesFromMap(e));

// Gennemsnit i vinduet (endMs - days, endMs]
function windowAvg(list, endMs, days) {
  const from = endMs - days * DAY;
  const vals = list.filter(e => { const t = ms(e.date); return t > from && t <= endMs; }).map(e => e.value);
  return vals.length ? { avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length } : { avg: null, count: 0 };
}
const r1 = n => (n == null ? null : Math.round(n * 10) / 10);

// 7-dages gennemsnit vs. de 7 dage før — ankret i den seneste måling, så en
// enkelt dag aldrig står alene som "fremgang".
export function weightTrend(entries) {
  const list = asList(entries);
  if (!list.length) return { ready: false, points: 0, latest: null, latestDate: null, avg: null, prevAvg: null, change: null, prevPoints: 0 };
  const latest = list[list.length - 1];
  const end = ms(latest.date);
  const cur = windowAvg(list, end, 7), prev = windowAvg(list, end - 7 * DAY, 7);
  return {
    ready: cur.count > 0,
    points: cur.count, prevPoints: prev.count,
    latest: latest.value, latestDate: latest.date,
    avg: r1(cur.avg), prevAvg: r1(prev.avg),
    change: cur.avg != null && prev.avg != null ? r1(cur.avg - prev.avg) : null
  };
}

// Kg pr. uge målt som seneste 7-dages snit mod snittet 14–21 dage tilbage.
// Kræver mindst ~3 ugers data — enkelte dage skal ikke kunne flytte målet.
export function weeklyRate(entries) {
  const list = asList(entries);
  if (list.length < 4) return null;
  const end = ms(list[list.length - 1].date);
  const spanDays = Math.round((end - ms(list[0].date)) / DAY);
  if (spanDays < 18) return null;
  const cur = windowAvg(list, end, 7), old = windowAvg(list, end - 14 * DAY, 7);
  if (!cur.count || !old.count) return null;
  return { kgPerWeek: Math.round(((cur.avg - old.avg) / 2) * 100) / 100, spanDays, points: list.length };
}

// Løftet volumen: seneste 14 dage mod de 14 dage før, i procent.
// entries: [{date, value}] hvor value er kg løftet i sessionen.
export function strengthChangePct(entries) {
  const list = asList(entries);
  if (!list.length) return null;
  const end = ms(list[list.length - 1].date);
  const sum = (from, to) => list.filter(e => { const t = ms(e.date); return t > from && t <= to; })
    .reduce((a, e) => a + e.value, 0);
  const cur = sum(end - 14 * DAY, end), prev = sum(end - 28 * DAY, end - 14 * DAY);
  if (!cur || !prev) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

// ── Adaptivt kaloriemål ───────────────────────────────────────────────────────
// Foreslår små justeringer (100–150 kcal) når den faktiske trend ligger uden
// for det forventede interval. Ændrer aldrig noget selv — UI skal spørge.
export function recommendedAdjustment({ goal = "recomp", calorieTarget: target, entries, rate, sex } = {}) {
  const r = rate !== undefined ? rate : weeklyRate(entries);
  if (!r || !target) return null;
  const { minKg: lo, maxKg: hi } = expectedWeeklyChange(goal);
  const v = r.kgPerWeek, weeks = Math.round(r.spanDays / 7);
  let delta = 0;
  if (v > hi) delta = v - hi > 0.25 ? -150 : -100;
  else if (v < lo) delta = lo - v > 0.25 ? 150 : 100;
  if (!delta) return null;
  const to = target + delta;
  if (delta < 0 && to < FLOOR[sex === "male" ? "male" : "female"]) return null; // aldrig ned under gulvet
  const kg = Math.abs(v).toString().replace(".", ",");
  const reason = delta < 0
    ? (Math.abs(v) < 0.1
        ? "Din vægttrend har været stabil de seneste " + weeks + " uger. Dit faktiske energibehov kan være lidt lavere end vores første estimat."
        : "Din vægt er gået " + (v > 0 ? "op" : "ned") + " ca. " + kg + " kg om ugen de seneste " + weeks + " uger — lidt mindre end dit mål lægger op til.")
    : "Din vægt er faldet ca. " + kg + " kg om ugen de seneste " + weeks + " uger. Det går hurtigere end nødvendigt — lidt mere mad gør det nemmere at holde.";
  return { direction: delta < 0 ? "down" : "up", delta, from: target, to, kgPerWeek: v, weeks, reason };
}

// ── Body recomposition-signal ─────────────────────────────────────────────────
// Konkluderer aldrig at der ER bygget muskel — kun "kan være tegn på".
export function recompSignal({ weightChangeKg, waistChangeCm, strengthChangePct } = {}) {
  if (weightChangeKg == null || waistChangeCm == null) return null;
  const stable = Math.abs(weightChangeKg) <= 0.4;
  if (!stable || waistChangeCm > -0.5) return null;
  const parts = ["Din vægt har været stabil, men dit taljemål er faldet. Det kan være tegn på body recomposition."];
  if (strengthChangePct != null && strengthChangePct > 2) parts.push("Din styrke er samtidig gået lidt frem.");
  return { text: parts.join(" ") };
}

// ── Samlet plan ───────────────────────────────────────────────────────────────
export function plan(input = {}) {
  const b = bmr(input);
  if (!b) return null;
  const af = activityFactor(input);
  const maint = Math.round(b * af);
  const target = calorieTarget({ tdee: maint, goal: input.goal, sex: input.sex, bmr: b });
  return {
    bmr: b, activityFactor: af, tdee: maint,
    calorieTarget: target.kcal, deficit: target.deficit, warning: target.warning, floored: target.floored,
    protein: proteinTarget(input), fiberG: fiberTarget(maint),
    expected: expectedWeeklyChange(input.goal),
    goal: target.goal,
    // Inputs gemmes sammen med resultatet, så vi kan se hvad tallene byggede på.
    inputs: {
      sex: input.sex === "male" ? "male" : "female",
      age: num(input.age), heightCm: num(input.heightCm), weightKg: num(input.weightKg),
      steps: num(input.steps), sessionsPerWeek: num(input.sessionsPerWeek), goal: target.goal
    }
  };
}
