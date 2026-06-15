/* ============================================================================
 * experiment.js — Controller / state machine for the Serial Position experiment
 *
 * Flow:  welcome -> [ presentation -> recall ] x3 (interstitial between) -> results
 *
 * All experiment state lives in plain JavaScript memory (the `session` object).
 * Nothing is written to localStorage/sessionStorage, so the app works even where
 * browser storage is blocked. A reload simply restarts the session.
 * ========================================================================== */

(function () {
  'use strict';

  /* --- Timing constants (milliseconds) ----------------------------------- */
  const WORD_DURATION_MS = 1000;  // each word is shown for exactly 1 second
  const ISI_MS           = 250;   // blank inter-stimulus interval between words
  const RECALL_SECONDS   = 90;    // free-recall window per trial

  /* --- DOM references ----------------------------------------------------- */
  const screens = {
    welcome:      document.getElementById('welcome'),
    presentation: document.getElementById('presentation'),
    recall:       document.getElementById('recall'),
    practiceDone: document.getElementById('practice-done'),
    interstitial: document.getElementById('interstitial'),
    results:      document.getElementById('results')
  };
  const participantInput = document.getElementById('participant');
  const beginBtn         = document.getElementById('begin-btn');
  const practiceDoneBtn  = document.getElementById('practice-done-btn');
  const wordEl           = document.getElementById('word');
  const progressBar      = document.getElementById('progress-bar');
  const recallForm       = document.getElementById('recall-form');
  const recallInput      = document.getElementById('recall-word');
  const recallList       = document.getElementById('recall-list');
  const recallCounter    = document.getElementById('recall-counter');
  const countdownEl      = document.getElementById('countdown');
  const doneBtn          = document.getElementById('done-btn');
  const continueBtn      = document.getElementById('continue-btn');

  /* --- Session state (in memory only) ------------------------------------ */
  let session = null;     // { participant, startedISO, trials: [] }
  let trialIndex = 0;     // 0-based index into activeLists
  let activeLists = [];   // the lists for the current run (3 real, or 1 practice)
  let isPractice = false; // true while a dry run is in progress

  /* Active-trial scratch state. */
  let presentationTimers = [];   // setTimeout ids for the current presentation
  let recallTimerId = null;      // setInterval id for the countdown
  let recallDeadline = 0;        // performance.now() timestamp when recall ends
  let currentRecalled = [];      // words typed this trial: { word, atISO } in typed order
  let recallLocked = false;

  /* Date+time logs for this trial (ISO 8601, real wall-clock). */
  let presentationStartISO = '';
  let recallStartISO = '';

  /* Prevent accidental loss of an in-progress session (reload / close tab). */
  let unloadGuardActive = false;
  function unloadHandler(e) {
    e.preventDefault();
    e.returnValue = '';   // required for the browser's native "leave site?" prompt
    return '';
  }
  function enableUnloadGuard() {
    if (!unloadGuardActive) {
      window.addEventListener('beforeunload', unloadHandler);
      unloadGuardActive = true;
    }
  }
  function disableUnloadGuard() {
    if (unloadGuardActive) {
      window.removeEventListener('beforeunload', unloadHandler);
      unloadGuardActive = false;
    }
  }

  /* --- Screen switching --------------------------------------------------- */
  function show(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('hidden', key !== name);
    });
    window.scrollTo(0, 0);
  }

  /* ======================================================================= *
   *  WELCOME  ->  REQUIRED PRACTICE
   * ======================================================================= */
  // Every student does the practice round first, so the warm-up (and any
  // practice effect) is the same for everyone. The practice uses the reserved
  // practice bank, so its words never appear in the real experiment.
  beginBtn.addEventListener('click', function () {
    const name = participantInput.value.trim();

    // Start a fresh in-memory session. Timestamp captured once, at session start
    // (which is the start of the required practice round).
    session = {
      participant: name,
      startedISO: new Date().toISOString(),
      practice: null,   // the practice round's record (kept separate from trials)
      trials: []        // the three real trials
    };
    isPractice = true;
    activeLists = [ buildPracticeList() ];
    trialIndex = 0;

    enableUnloadGuard();      // protect the whole session until results render
    startPresentation();
  });

  /* After the required practice, begin the real experiment with freshly drawn
   * real lists. The practice data stays in session.practice, separate from the
   * real trials, the chart, and the real scoring. */
  practiceDoneBtn.addEventListener('click', function () {
    isPractice = false;
    session.realStartedISO = new Date().toISOString();
    activeLists = buildRealLists();   // randomly drawn 3 x 15 from the real bank
    trialIndex = 0;

    enableUnloadGuard();
    startPresentation();
  });

  /* ======================================================================= *
   *  PRESENTATION  (words one at a time, chained setTimeout)
   * ======================================================================= */
  function startPresentation() {
    const list = activeLists[trialIndex];
    presentationTimers = [];
    presentationStartISO = new Date().toISOString();   // when the words began
    wordEl.textContent = '';
    progressBar.style.width = '0%';
    show('presentation');

    // Schedule each word: shown for WORD_DURATION_MS, then a blank ISI gap.
    // The loop ends cleanly after word 15's display + ISI — there is no 16th tick.
    let elapsed = 0;
    for (let i = 0; i < list.words.length; i++) {
      const word = list.words[i];
      const position = i + 1;

      // Show the word.
      presentationTimers.push(setTimeout(function () {
        wordEl.textContent = word;
        progressBar.style.width = ((position / list.words.length) * 100) + '%';
      }, elapsed));
      elapsed += WORD_DURATION_MS;

      // Blank the stage for the inter-stimulus interval.
      presentationTimers.push(setTimeout(function () {
        wordEl.textContent = '';
      }, elapsed));
      elapsed += ISI_MS;
    }

    // After the final word's display + ISI, go straight to recall.
    presentationTimers.push(setTimeout(function () {
      startRecall();
    }, elapsed));
  }

  function clearPresentationTimers() {
    presentationTimers.forEach(clearTimeout);
    presentationTimers = [];
  }

  /* ======================================================================= *
   *  RECALL  (90s free recall, one word per Enter)
   * ======================================================================= */
  function startRecall() {
    clearPresentationTimers();

    currentRecalled = [];
    recallLocked = false;
    recallList.innerHTML = '';
    recallCounter.textContent = '0';
    recallInput.value = '';
    recallInput.disabled = false;
    doneBtn.disabled = false;
    recallStartISO = new Date().toISOString();   // when free recall began

    show('recall');
    recallInput.focus();

    // Countdown driven by wall-clock (performance.now) so display stays accurate
    // even if a tick is delayed; setInterval only refreshes the readout.
    recallDeadline = performance.now() + RECALL_SECONDS * 1000;
    updateCountdown();
    recallTimerId = setInterval(updateCountdown, 250);
  }

  function updateCountdown() {
    const remainingMs = Math.max(0, recallDeadline - performance.now());
    const remaining = Math.ceil(remainingMs / 1000);
    const mm = Math.floor(remaining / 60);
    const ss = remaining % 60;
    countdownEl.textContent = mm + ':' + (ss < 10 ? '0' + ss : ss);
    countdownEl.classList.toggle('low', remaining <= 10);

    if (remainingMs <= 0) {
      lockRecall();
    }
  }

  // Capture a typed word. Preserve exactly what the student typed (only trimming
  // surrounding whitespace) — no autocorrect, no filtering of intrusions/dupes.
  recallForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (recallLocked) return;

    const raw = recallInput.value.trim();
    recallInput.value = '';
    if (raw === '') return;

    // Keep the raw word AND the moment it was typed (date + time).
    currentRecalled.push({ word: raw, atISO: new Date().toISOString() });

    const li = document.createElement('li');
    li.textContent = raw;
    recallList.appendChild(li);
    recallCounter.textContent = String(currentRecalled.length);
  });

  doneBtn.addEventListener('click', function () {
    if (!recallLocked) lockRecall();
  });

  function lockRecall() {
    if (recallLocked) return;
    recallLocked = true;

    if (recallTimerId !== null) {
      clearInterval(recallTimerId);
      recallTimerId = null;
    }
    countdownEl.textContent = '0:00';
    recallInput.disabled = true;
    doneBtn.disabled = true;

    // Practice round: store its data in session.practice (kept separate from the
    // real trials), then move on to the real experiment. The guard stays on.
    if (isPractice) {
      session.practice = {
        trial: 0,
        label: 'Practice',
        words: activeLists[0].words.slice(),
        recalled: currentRecalled.slice(),
        presentationStartISO: presentationStartISO,
        recallStartISO: recallStartISO,
        recallEndISO: new Date().toISOString()
      };
      show('practiceDone');
      return;
    }

    // Real run: store this trial's record (raw words preserved in typed order)
    // plus the date+time log: when words were shown, recall opened, recall closed.
    const list = activeLists[trialIndex];
    session.trials.push({
      trial: list.trial,
      label: list.label,
      words: list.words.slice(),
      recalled: currentRecalled.slice(),
      presentationStartISO: presentationStartISO,
      recallStartISO: recallStartISO,
      recallEndISO: new Date().toISOString()
    });

    advanceTrial();
  }

  /* ======================================================================= *
   *  ADVANCE  (interstitial between trials, results after the last)
   * ======================================================================= */
  function advanceTrial() {
    trialIndex += 1;

    if (trialIndex < activeLists.length) {
      show('interstitial');
    } else {
      finish();
    }
  }

  continueBtn.addEventListener('click', function () {
    startPresentation();
  });

  function finish() {
    // Session is complete — the data is safe to leave now, so drop the guard.
    disableUnloadGuard();
    show('results');
    // results.js owns scoring, chart, table, and CSV export.
    Results.render(session);
  }

})();
