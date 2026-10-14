// Run every phrase through chrono's Indonesian parser and write what it read.
//
//   cd measure && npm install && TZ=Asia/Jakarta node run.mjs ../results/chrono-2.10.3.json
//   TZ=Asia/Jakarta node run.mjs ../results/chrono-fix.json /path/to/chrono/checkout   (a source checkout, via tsx)
//
// chrono is called the way a booking or reminder bot would call it: the casual Indonesian parser,
// the reference moment from phrases.json, and forwardDate, so a time that has passed means the next one.
import { readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { judge } from "../scripts/judge.mjs"

const [outPath = "../results/chrono.json", checkout] = process.argv.slice(2)
if (process.env.TZ !== "Asia/Jakarta") throw new Error("run with TZ=Asia/Jakarta, so local dates are Jakarta dates")
const data = JSON.parse(readFileSync(new URL("../phrases.json", import.meta.url), "utf8"))

let id
let label
if (checkout) {
  id = await import(pathToFileURL(join(resolve(checkout), "src/locales/id/index.ts")).href)
  label = process.env.LABEL ?? "chrono (source)"
} else {
  id = (await import("chrono-node")).id
  label = `chrono-node ${JSON.parse(readFileSync(new URL("node_modules/chrono-node/package.json", import.meta.url), "utf8")).version}`
}

const reference = { instant: new Date(data.reference), timezone: 420 }
const LOCAL = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

/** A Date as Jakarta "YYYY-MM-DD" and "HH:MM". */
function local(date) {
  const parts = Object.fromEntries(LOCAL.formatToParts(date).map((p) => [p.type, p.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

const readings = data.phrases.map((p) => {
  const [first] = id.casual.parse(p.text, reference, { forwardDate: true })
  const read = first ? { ...local(first.start.date()), matched: first.text } : null
  return { id: p.id, read, outcome: judge(p, read) }
})

writeFileSync(outPath, JSON.stringify({ parser: label, runtime: `node ${process.version}`, reference: data.reference, readings }, null, 2) + "\n")
const counts = readings.reduce((c, r) => ({ ...c, [r.outcome]: (c[r.outcome] ?? 0) + 1 }), {})
process.stdout.write(`${label}: ${JSON.stringify(counts)} -> ${outPath}\n`)
