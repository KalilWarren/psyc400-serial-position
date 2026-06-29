# PSYC 400 Self-Experiments

Two independent, client-side memory experiments for PSYC 400, deployed together
via GitHub Pages. Each has its own URL so they can be assigned separately.

**Live links (share with students):**

- **Self-Experiment 1 — Serial Position Effect:**
  https://kalilwarren.github.io/psyc400-serial-position/
- **Self-Experiment 2 — Word Memory:**
  https://kalilwarren.github.io/psyc400-serial-position/se2/

Both run entirely in the browser: **no server, no build step, no database.** The
only external libraries are [Chart.js](https://www.chartjs.org/) (charts) and
[SheetJS](https://sheetjs.com/) (Excel export), loaded from a CDN, so an internet
connection is required. All data stays in the browser's memory and is gone on
reload, except for the Excel file a student chooses to download.

> ⚠️ **The published site is public.** Anyone with a link can open it. A student's
> name is included only in the Excel file they download; it is never sent anywhere.

---

# Self-Experiment 1: The Serial Position Effect

A single-page, client-side website for a serial-position free-recall memory
experiment used in PSYC 400. It runs three trials (three 15-word lists), records
free recall after each list, and shows the student a raw serial position curve
plus a downloadable Excel workbook of their data.

The three lists are drawn at random from a larger word bank at the start of each
session, so students see different words but do the identical task. Every student
is also **required to complete a short practice round first** (so any practice
effect is the same for everyone). The practice uses a completely separate set of
words — never the real stimuli — and its data is kept on its own tab in the
export, apart from the real trials, the chart, and the scoring.

### What's in the downloaded Excel file

The student downloads a single Excel workbook (`.xlsx`) with five tabs, openable
in Excel or Google Sheets:

1. **Metadata** — participant name, app version, and date+time logs (session
   start, and when each real trial's words were shown / recall opened / closed).
2. **Events** — every word the student typed in the **real trials**, in order,
   flagged `hit` or `intrusion`, each with the time it was typed.
3. **Scoring** — the same table shown on screen (positions 1–15, words,
   recalled-or-not per trial, total /3, proportion). Real trials only.
4. **Figure** — the x/y values behind the serial position curve. Real trials
   only. (The chart image isn't embedded; select these two columns and insert a
   line chart to recreate the figure.)
5. **Practice** — the required warm-up round's words and responses, kept
   **completely separate** from the real data above (not in the chart or scoring).

An *intrusion* is a recalled word that was not on the studied list — a non-list
word, or a list word spelled differently enough that it didn't match exactly.

---

## For the instructor — deploying with GitHub Pages

This project is **already deployed** at the live links above. Both experiments
ship from this one repository, with this structure:

```
index.html            ← SE1 page
se2/index.html        ← SE2 page
css/style.css         ← shared stylesheet
js/wordlists.js       ← SE1 stimuli
js/experiment.js      ← SE1 flow
js/results.js         ← SE1 scoring + Excel export
js/se2-stimuli.js     ← SE2 stimuli
js/se2-experiment.js  ← SE2 flow
js/se2-results.js     ← SE2 scoring + Excel export
README.md
```

To deploy a fresh copy (e.g. in a forked repository):

1. Push these files to a GitHub repository, keeping the folder structure above.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder, then click **Save**.
5. Wait ~1 minute. GitHub shows a public URL like
   `https://<your-username>.github.io/<repo-name>/` (SE2 is at that URL + `/se2/`).
6. Open the URL to confirm it works, then share the links with students.

To update the live site, just edit the files and push to `main`; GitHub Pages
rebuilds automatically within a minute or two.

The pages also work if you open `index.html` (or `se2/index.html`) directly from
your computer — useful for testing. An internet connection is required either
way, because the libraries load from a CDN.

### Changing the words

All the words live in **`js/wordlists.js`** and that is the only file you need to
edit. There are two separate banks:

- **`REAL_WORD_BANK`** — the real experiment randomly draws 45 words from this
  bank each session (3 lists × 15). Keep at least 45; add more for greater
  variety between students.
- **`PRACTICE_WORD_BANK`** — used only for the practice run, and never in the
  real experiment. Keep these words distinct from the real bank.

The comments at the top of the file explain the rules. Save and reload — no other
file needs to change.

---

## For students — what you do

1. Open the link your instructor gave you (a phone or computer both work).
2. Read the instructions, type your **name**, and press **Begin practice**.
   Everyone does a short practice round first (it uses different words and does
   not count). When it ends, press **Begin the real experiment** to continue.
3. **Watch the words.** Each word appears for one second. Just study them —
   **do not write anything down.**
4. When the words stop, you have **90 seconds** to type every word you remember:
   type a word, press **Enter**, repeat. Order does not matter, and spelling
   does not need to be perfect. Press **Done** if you finish early.
5. Take a short rest, then **Continue** to the next list. You do this **three
   times** in total.
6. On the results screen, press **Download Excel (.xlsx)** to save your data,
   and/or take a **screenshot** of the chart and table for your write-up.

The results screen shows your data only — the chart and the numbers. Figuring
out what the curve *means* is your job for the assignment.

---

# Self-Experiment 2: Word Memory

A second, independent experiment that lives in the same repository as a separate
page with its own URL. It is built the same way as Self-Experiment 1 (client-side
only, Chart.js + SheetJS from a CDN, all data in browser memory).

In SE2 the participant sees a series of words. Each word appears with one of two
quick questions: a **vowel-counting** question, or a **does-this-word-fit-the-sentence**
question. After a short counting task (typing the numbers counting down from 30,
which must be completed to continue), there is a surprise recognition test in which
studied words are mixed with new words and the
participant answers **Yes** or **No** to whether each word appeared previously. The
results screen shows the participant's own raw counts and two simple bar figures (one
comparing the two tasks, and a bonus one comparing recognition within the sentence
task for fitting vs non-fitting sentences); it does not interpret them. Each word is
assigned to a task at random for each participant, so there is no shared answer key.

- **Student URL:** https://kalilwarren.github.io/psyc400-serial-position/se2/
- **SE1 is unaffected** by SE2 (separate page and separate scripts; the shared
  stylesheet only gained new rules).

### What's in the downloaded Excel file (SE2)

A single workbook (`.xlsx`) with six tabs:

1. **Metadata** — participant name, app version, and date+time logs (session start;
   when the study and test phases opened and closed), plus definitions of *hit* and
   *false alarm*.
2. **Study** — every study trial in order: word, task (vowel / sentence), the
   orienting question, the response, and response time.
3. **Test** — every recognition item in order: word, whether it was studied or new,
   which task it was studied under (if studied), the Yes/No response (did it appear
   previously?), and whether that response was correct.
4. **Scoring** — the on-screen summary: vowel-task words recognized /20, sentence-task
   words recognized /20, false alarms /40, plus the sentence-task breakdown for fitting
   (Yes) vs non-fitting (No) sentences /10 each.
5. **Figure** — the values behind both bar charts: the two-task chart (vowel vs
   sentence) and the sentence-task breakdown (fitting vs non-fitting), so the figures
   can be rebuilt in Excel.
6. **Practice** — the warm-up trials and responses, kept completely separate from the
   data above.

Definitions: a **hit** is a studied word correctly answered "Yes" (appeared); a
**false alarm** is a new word incorrectly answered "Yes."

### For students — what you do (SE2)

1. Open the SE2 link (phone or computer both work).
2. Read the instructions, type your **name**, and press **Begin practice round**.
   Everyone does a short practice first; it uses different words and does not count.
3. For each word, answer the question shown: type the **number of vowels** and press
   Enter, or choose **Yes / No** for whether the word fits the sentence. Answer as
   quickly and accurately as you can.
4. Do the brief **counting task** when it appears (type the numbers counting down
   from 30; you must enter them all to continue).
5. Then answer **Yes** or **No** for whether each word appeared previously.
6. On the results screen, press **Download data (.xlsx)** and/or take a **screenshot**
   for your report.

The results screen shows your data only. Figuring out what the numbers mean is your
job for the assignment.

### Changing the words (SE2)

All SE2 stimuli live in **`js/se2-stimuli.js`** (the only file to edit):

- **`REAL_POOL`** — studied words, each paired with a sentence frame the word fits.
  The app draws 40 per session (20 per task). Keep at least 40.
- **`DISTRACTOR_POOL`** — "new" words for the test; keep at least 40 and do **not**
  overlap `REAL_POOL`.
- **`NONFIT_FRAMES`** — sentences that require an abstract word, so no concrete noun
  fits them. These create the "No" trials.
- **`PRACTICE_WORDS` / `PRACTICE_NONFIT`** — the separate warm-up set. Practice
  words are automatically removed from the real study draw and the test
  distractors at runtime, so they can never appear in the real trial even if a
  list is edited so they overlap.

**Balancing the sentence task:** of the 20 words assigned to the sentence task each
session, 10 are shown in their own *fitting* frame (correct answer "Yes") and 10 in a
random *non-fitting* frame (correct answer "No"). Because the non-fitting frames need
an abstract word that no concrete noun satisfies, the "No" trials stay reliable no
matter which words land in the sentence task. The comments at the top of the file
explain this in detail.

### Deploying SE2

SE2 is already part of this repository at `se2/index.html`, so the same GitHub Pages
deployment that serves SE1 also serves SE2 — no extra setup. After pushing, SE2 is
reachable at the subpath URL above. You can hand students the SE1 and SE2 links
separately.
