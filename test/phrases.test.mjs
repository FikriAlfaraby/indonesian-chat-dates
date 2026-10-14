import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"

import { dateMatches, judge, timeMatches } from "../scripts/judge.mjs"

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"))
const data = read("phrases.json")
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s)
const isTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s)

test("every phrase has a unique id, a kind, and a valid meaning", () => {
  const ids = new Set()
  for (const p of data.phrases) {
    assert.ok(!ids.has(p.id), `${p.id}: used twice`)
    ids.add(p.id)
    assert.ok(p.text.trim().length > 0, `${p.id}: empty text`)
    assert.ok(p.group && p.means, `${p.id}: needs a kind and a plain meaning`)
    if (typeof p.date === "string") assert.ok(isDate(p.date), `${p.id}: bad date ${p.date}`)
    else if (Array.isArray(p.date)) assert.ok(p.date.length > 1 && p.date.every(isDate), `${p.id}: a list of dates needs two or more`)
    else assert.ok(isDate(p.date.from) && isDate(p.date.to) && p.date.from <= p.date.to, `${p.id}: bad date range`)
    if (typeof p.time === "string") assert.ok(isTime(p.time), `${p.id}: bad time ${p.time}`)
    else if (p.time !== null) assert.ok(isTime(p.time.from) && isTime(p.time.to) && p.time.from <= p.time.to, `${p.id}: bad time range`)
  }
})

test("a reading is right only when the date, and the time if stated, are ones the phrase means", () => {
  assert.equal(judge({ date: "2026-10-15", time: "10:00" }, { date: "2026-10-15", time: "10:00" }), "right")
  assert.equal(judge({ date: "2026-10-15", time: "10:00" }, { date: "2026-10-14", time: "10:00" }), "wrong date")
  assert.equal(judge({ date: "2026-10-15", time: "10:00" }, { date: "2026-10-15", time: "22:00" }), "wrong time")
  assert.equal(judge({ date: "2026-10-15", time: null }, null), "missed")
  assert.ok(dateMatches(["2026-10-16", "2026-10-23"], "2026-10-23"))
  assert.ok(dateMatches({ from: "2026-10-19", to: "2026-10-25" }, "2026-10-21"))
  assert.ok(timeMatches({ from: "18:00", to: "23:59" }, "20:00"))
  assert.ok(!timeMatches({ from: "18:00", to: "23:59" }, "00:00"))
})

for (const file of ["results/chrono-2.10.3.json", "results/chrono-fixes.json"]) {
  test(`${file} covers every phrase and its outcomes follow from today's phrases`, () => {
    if (!existsSync(new URL(`../${file}`, import.meta.url))) return
    const run = read(file)
    const byId = new Map(run.readings.map((r) => [r.id, r]))
    assert.deepEqual([...byId.keys()].sort(), data.phrases.map((p) => p.id).sort())
    for (const p of data.phrases) assert.equal(byId.get(p.id).outcome, judge(p, byId.get(p.id).read), `${p.id} ${p.text}: rerun the measure script`)
  })
}

test("the README's table says what the results say", () => {
  if (!existsSync(new URL("../results/results.json", import.meta.url))) return
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8")
  for (const s of Object.values(read("results/results.json").summary)) {
    const row = `| ${s.parser} | ${s.right} | ${s["wrong date"]} | ${s["wrong time"]} | ${s.missed} |`
    assert.ok(readme.includes(row), `README is missing or out of date: ${row}`)
  }
})
