# indonesian-chat-dates

**124 dates and times written the way Indonesians type them in chat, with the moment each one
means.**

"bsk jam 10", "jam setengah 8 malam", "tgl 20", "malam Minggu", "akhir bulan ini". A WhatsApp
booking bot, a reminder app or a lead tracker in Indonesia reads phrases like these all day. This is
a test set for whatever reads them: each phrase says which date (and time, when it states one) a
person means, against a fixed "now": **Wednesday 14 October 2026, 10:00 in Jakarta**.

```json
{
  "id": "071",
  "group": "time",
  "text": "jam setengah 8 malam",
  "date": "2026-10-14",
  "time": "19:30",
  "means": "7:30 pm today",
  "note": "'Setengah delapan' is half past seven, as in Dutch and German: not 8:30."
}
```

## chrono, measured

[chrono](https://github.com/wanasit/chrono) is the common JavaScript date parser (about 2.3 million
npm downloads a week). It added Indonesian in version 2.10.3. Run the way a booking bot would call it
(the casual Indonesian parser, `forwardDate: true`):

| Parser | Right | Wrong date | Wrong time | Missed |
|---|---:|---:|---:|---:|
| chrono-node 2.10.3 | 77 | 26 | 4 | 17 |
| chrono-node 2.10.3 + 10 fixes | 117 | 5 | 0 | 2 |

The misses that matter most in a chat:

- "bsk jam 10" is read as **today** at 10, because "bsk" (the usual spelling of besok, tomorrow) is
  unknown and only "jam 10" is found.
- "jam setengah 8 malam" is read as **20:00**. "Setengah delapan" is half past seven, 19:30.
- "jam 8 kurang 15 malam" (19:45) is read as **08:00 tomorrow**.
- "akhir bulan ini" (the end of this month) is read as **1 October**, a deadline already gone.
- "malam Minggu" (Saturday night) is read as **tonight**, Wednesday.
- "tgl 20" (the 20th) is not found at all.

The ten fixes, one small change each (in `results/per-fix/`, every one measured on its own and none
breaking a phrase the release reads right). Nine are in the Indonesian locale; one is in chrono's core:

| Fix | Phrases it fixes |
|---|---:|
| Chat spellings: bsk, kemaren, kmrn, hr ini, ntar malem, jm, mlm, yg, dlm | 12 |
| Half and quarter hours: setengah 8, 8 kurang 15, 4 lewat seperempat | 7 |
| A day of the month: tanggal 17, tgl 20 bulan depan | 6 |
| The night before a weekday: malam Minggu is Saturday night | 4 |
| The start, middle and end of a month: akhir bulan, awal bulan depan | 4 |
| The weekend: akhir pekan, weekend ini | 2 |
| A weekday followed by besok: Senin besok is the coming Monday | 1 |
| Earlier today: tadi pagi | 1 |
| Approximate hours: jam 9an | 1 |
| Core: `forwardDate` keeps a weekday the text says is past (Selasa lalu, and English "last Tuesday") | 2 |

### What is still wrong, and why

- **"tadi malam" (last night)** is read as midnight at the start of today. That is the locale's
  existing, tested behaviour; it is left for the maintainer to decide.
- **"17 Agustus kemarin"** (the 17 August that just passed) says the date is past, but `forwardDate`
  moves it to next year. The core fix covers weekdays ("Selasa lalu", "last Tuesday"), not month
  names.
- **"jam 2", "jam 4an"** without a day period are read as 2 and 4 in the morning, as chrono reads
  English "at 2". In a chat at 10 am, people mean the afternoon.
- **"subuh", "habis maghrib"** name times by the prayer schedule, which moves with place and season.

## Use it

The data file is the product: copy `phrases.json`, or fetch it from
`https://raw.githubusercontent.com/FikriAlfaraby/indonesian-chat-dates/main/phrases.json`. Parse each
`text` with your reference set to `reference` (Jakarta time) and compare with `date` and `time`:

- `date` is one date, a list of dates (where usage is split, e.g. "Jumat depan" said on a Wednesday),
  or a range `{from, to}` for vague phrases such as "minggu depan" (next week).
- `time` is `null` when the phrase states no time, an exact `HH:MM`, or a range for a part of the day
  (`pagi` 05:00–11:00, `sore` 15:00–18:00, `malam` 18:00–23:59).

Expected values are read forward: a time already past today means the next one, as a booking bot
needs; explicit past words (kemarin, lalu, tadi) stay in the past.

## Measure chrono yourself

```bash
cd measure && npm install && TZ=Asia/Jakarta node run.mjs ../results/chrono-2.10.3.json
# a source checkout of chrono (with tsx installed):
TZ=Asia/Jakarta LABEL="my branch" npx tsx run.mjs ../results/my-branch.json ../../chrono
node scripts/report.mjs
```

`npm test` checks the phrases and that the published results still follow from them.

## Limits

- 124 phrases written for this test, one per pattern, not a sample of real chat traffic. They show
  what a parser does with each pattern, not how often people write it.
- The expected values are what an Indonesian reader means; where readers differ, every common
  reading is accepted.

MIT licence. Fikri Alfaraby, [fikrialfaraby.com](https://fikrialfaraby.com).
