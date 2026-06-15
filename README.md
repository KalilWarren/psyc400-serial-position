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
