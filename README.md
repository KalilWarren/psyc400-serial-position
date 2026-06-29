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

Everything runs in the browser. There is **no server, no build step, and no
database** — the only external libraries are
[Chart.js](https://www.chartjs.org/) (draws the curve) and
[SheetJS](https://sheetjs.com/) (builds the Excel file), both loaded from a CDN.
All data stays in the browser's memory and is gone when the page is reloaded,
except for whatever the student downloads.

> ⚠️ **The published site is public.** Anyone with the link can open it. Do not
> put confidential information on the page, and tell students that their name is
> included in the Excel file they download (it is **not** sent anywhere — it
> stays on their own device).

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

1. Create a new GitHub repository (e.g. `serial-position`) and upload these
   files, keeping the folder structure:

   ```
   index.html
   css/style.css
   js/wordlists.js
   js/experiment.js
   js/results.js
   README.md
   ```

2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder, then click **Save**.
5. Wait ~1 minute. GitHub will show a public URL like
   `https://<your-username>.github.io/serial-position/`.
6. Open that URL to confirm it works, then share the link with students.

The site also works if you just open `index.html` directly from your computer
(double-click it) — useful for testing without deploying. An internet connection
is required either way, because the chart library loads from a CDN.

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
results screen shows the participant's own raw counts and a simple two-bar figure; it
does not interpret them. Each word is assigned to a task at random for each
participant, so there is no shared answer key.

- **Student URL (once deployed):** `https://kalilwarren.github.io/psyc400-serial-position/se2/`
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
   words recognized /20, false alarms /40.
5. **Figure** — the two values behind the bar chart (vowel task, sentence task), so
   the figure can be rebuilt in Excel.
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
- **`PRACTICE_WORDS` / `PRACTICE_NONFIT`** — the separate warm-up set.

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
