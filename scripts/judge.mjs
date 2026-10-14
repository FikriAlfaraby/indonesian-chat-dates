// Whether a reading matches what a phrase means. Shared by the measure script and the tests.
//
//   right       the date is one the phrase means, and so is the time when it states one
//   wrong date  a date the phrase does not mean
//   wrong time  the right date at a time the phrase does not mean
//   missed      no date found at all

const inRange = (value, range) => range.from <= value && value <= range.to

export function dateMatches(expected, date) {
  if (typeof expected === "string") return date === expected
  if (Array.isArray(expected)) return expected.includes(date)
  return inRange(date, expected)
}

export function timeMatches(expected, time) {
  if (expected === null || expected === undefined) return true
  if (typeof expected === "string") return time === expected
  return inRange(time, expected)
}

export function judge(phrase, read) {
  if (!read) return "missed"
  if (!dateMatches(phrase.date, read.date)) return "wrong date"
  if (!timeMatches(phrase.time, read.time)) return "wrong time"
  return "right"
}
