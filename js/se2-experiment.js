/* ============================================================================
 * se2-experiment.js — Controller / state machine for Self-Experiment 2
 *
 * Flow: welcome -> practice study -> practice-done -> real study -> filler(30s)
 *       -> test-intro (surprise) -> recognition test -> results
 *
 * All state lives in plain JavaScript memory (the `session` object). Nothing is
 * persisted, so it works where browser storage is blocked; a reload restarts.
 *
 * Internal note (NOT shown to students): SE2 is a levels-of-processing study.
 * Task A (vowel counting) is the shallow/structural condition and Task B
 * (sentence fit) is the deep/semantic condition. The interface never names this.
 * ========================================================================== */

(function () {
  'use strict';

  const FILLER_SECONDS = 30;

  /* --- Screens + show() --------------------------------------------------- */
  const screens = {
    welcome:      document.getElementById('welcome'),
    trial:        document.getElementById('trial'),
    practiceDone: document.getElementById('practice-done'),
    filler:       document.getElementById('filler'),
    testIntro:    document.getElementById('test-intro'),
    test:         document.getElementById('test'),
    results:      document.getElementById('results')
  };
  let currentScreen = 'welcome';
  function show(name) {
    currentScreen = name;
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('hidden', key !== name);
    });
    window.scrollTo(0, 0);
  }

  /* --- DOM references ----------------------------------------------------- */
  const participantInput = document.getElementById('participant');
  const beginBtn         = document.getElementById('begin-btn');
  const practiceDoneBtn  = document.getElementById('practice-done-btn');
  const testIntroBtn     = document.getElementById('test-intro-btn');

  const trialWord     = document.getElementById('trial-word');
  const trialFrame    = document.getElementById('trial-frame');
  const trialQuestion = document.getElementById('trial-question');
  const trialAForm    = document.getElementById('trial-a-form');
  const trialAInput   = document.getElementById('trial-a-input');
  const trialBChoices = document.getElementById('trial-b-choices');
  const trialProgress = document.getElementById('trial-progress');

  const fillerCount = document.getElementById('filler-count');

  const testWord     = document.getElementById('test-word');
  const testProgress = document.getElementById('test-progress');

  /* --- Session state (in memory only) ------------------------------------ */
  let session = null;
  let isPractice = false;

  let studyList = [];     // active study trials (practice or real)
  let studyIndex = 0;
  let currentTrial = null;
  let trialOnset = 0;     // performance.now() at trial display

  let testList = [];
  let testIndex = 0;

  let fillerTimerId = null;
  let fillerDeadline = 0;

  /* --- beforeunload guard (protect a run in progress) -------------------- */
  let unloadGuardActive = false;
  function unloadHandler(e) { e.preventDefault(); e.returnValue = ''; return ''; }
  function enableUnloadGuard() {
    if (!unloadGuardActive) { window.addEventListener('beforeunload', unloadHandler); unloadGuardActive = true; }
  }
  function disableUnloadGuard() {
    if (unloadGuardActive) { window.removeEventListener('beforeunload', unloadHandler); unloadGuardActive = false; }
  }

  function nowISO() { return new Date().toISOString(); }

  /* ======================================================================= *
   *  WELCOME -> PRACTICE
   * ======================================================================= */
  beginBtn.addEventListener('click', function () {
    session = {
      participant: participantInput.value.trim(),
      startedISO: nowISO(),
      studyStartISO: '', studyEndISO: '',
      testStartISO: '', testEndISO: '',
      practice: { studyTrials: [] },
      study: [],
      test: []
    };
    isPractice = true;
    studyList = buildPracticeStudy();
    studyIndex = 0;
    enableUnloadGuard();
    showTrial();
  });

  /* After practice, begin the real study phase with a fresh study set. */
  practiceDoneBtn.addEventListener('click', function () {
    isPractice = false;
    studyList = buildStudySet();
    studyIndex = 0;
    session.studyStartISO = nowISO();
    showTrial();
  });

  /* ======================================================================= *
   *  STUDY TRIALS  (self-paced; response time logged)
   * ======================================================================= */
  function showTrial() {
    currentTrial = studyList[studyIndex];
    trialProgress.style.width = ((studyIndex / studyList.length) * 100) + '%';

    trialWord.textContent = currentTrial.word;

    if (currentTrial.task === 'A') {
      // Structural task: count the vowels.
      trialFrame.classList.add('hidden');
      trialBChoices.classList.add('hidden');
      trialAForm.classList.remove('hidden');
      trialQuestion.textContent = 'How many vowels are in this word?';
      trialAInput.value = '';
      trialAInput.focus();
    } else {
      // Semantic task: does the word fit the sentence?
      trialFrame.innerHTML = renderFrame(currentTrial.frame);
      trialFrame.classList.remove('hidden');
      trialAForm.classList.add('hidden');
      trialBChoices.classList.remove('hidden');
      trialQuestion.textContent = 'Does this word fit in the sentence?';
    }

    show('trial');
    trialOnset = performance.now();
  }

  // Render a frame, highlighting the blank token.
  function renderFrame(frame) {
    var safe = String(frame)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return safe.replace(SE2_BLANK, '<span class="blank">' + SE2_BLANK + '</span>');
  }

  // Task A submit (Enter / button).
  trialAForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (currentScreen !== 'trial' || currentTrial.task !== 'A') return;
    var raw = trialAInput.value.trim();
    if (raw === '') return;                  // require an entry
    recordStudyTrial(raw);
  });

  // Task B answer (button click or Y/N key).
  trialBChoices.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-choice');
    if (btn) answerB(btn.getAttribute('data-answer'));
  });
  function answerB(answer) {
    if (currentScreen !== 'trial' || currentTrial.task !== 'B') return;
    recordStudyTrial(answer === 'yes' ? 'Yes' : 'No');
  }

  function recordStudyTrial(response) {
    var rt = Math.round(performance.now() - trialOnset);
    var rec = {
      order: studyIndex + 1,
      word: currentTrial.word,
      task: currentTrial.task,
      frame: currentTrial.frame || '',
      intendedFit: currentTrial.intendedFit || '',
      response: response,
      vowelCount: currentTrial.task === 'A' ? se2VowelCount(currentTrial.word) : '',
      rtMs: rt,
      shownAtISO: new Date(performance.timeOrigin + trialOnset).toISOString()
    };
    if (isPractice) session.practice.studyTrials.push(rec);
    else session.study.push(rec);

    studyIndex += 1;
    if (studyIndex < studyList.length) {
      showTrial();
    } else {
      endStudyPhase();
    }
  }

  function endStudyPhase() {
    if (isPractice) {
      show('practiceDone');
    } else {
      session.studyEndISO = nowISO();
      startFiller();
    }
  }

  /* ======================================================================= *
   *  FILLER  (30s spoken count-backward distractor; nothing typed or scored)
   * ======================================================================= */
  function startFiller() {
    show('filler');
    fillerDeadline = performance.now() + FILLER_SECONDS * 1000;
    updateFiller();
    fillerTimerId = setInterval(updateFiller, 250);
  }
  function updateFiller() {
    var remMs = Math.max(0, fillerDeadline - performance.now());
    var rem = Math.ceil(remMs / 1000);
    fillerCount.textContent = rem;          // big number to count along with, out loud
    if (remMs <= 0) endFiller();
  }
  function endFiller() {
    if (fillerTimerId !== null) { clearInterval(fillerTimerId); fillerTimerId = null; }
    show('testIntro');
  }

  /* ======================================================================= *
   *  RECOGNITION TEST  (surprise; Old / New per item)
   * ======================================================================= */
  testIntroBtn.addEventListener('click', function () {
    testList = buildTestList(session.study);
    testIndex = 0;
    session.testStartISO = nowISO();
    showTestItem();
  });

  function showTestItem() {
    var item = testList[testIndex];
    testProgress.style.width = ((testIndex / testList.length) * 100) + '%';
    testWord.textContent = item.word;
    show('test');
    trialOnset = performance.now();
  }

  document.getElementById('test-choices').addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-choice');
    if (btn) answerTest(btn.getAttribute('data-answer'));
  });
  function answerTest(answer) {
    if (currentScreen !== 'test') return;
    var item = testList[testIndex];
    var rt = Math.round(performance.now() - trialOnset);
    var correct = (item.type === 'old' && answer === 'old') ||
                  (item.type === 'new' && answer === 'new');
    session.test.push({
      order: testIndex + 1,
      word: item.word,
      type: item.type,
      task: item.task || '',
      response: answer,
      correct: correct,
      rtMs: rt,
      shownAtISO: new Date(performance.timeOrigin + trialOnset).toISOString()
    });

    testIndex += 1;
    if (testIndex < testList.length) {
      showTestItem();
    } else {
      finish();
    }
  }

  function finish() {
    session.testEndISO = nowISO();
    disableUnloadGuard();          // run complete; safe to leave
    show('results');
    SE2Results.render(session);
  }

  /* ======================================================================= *
   *  KEYBOARD  (Y/N for Task B, O/N for the test; Enter handled by the form)
   * ======================================================================= */
  document.addEventListener('keydown', function (e) {
    if (currentScreen === 'trial' && currentTrial && currentTrial.task === 'B') {
      if (e.key === 'y' || e.key === 'Y') answerB('yes');
      else if (e.key === 'n' || e.key === 'N') answerB('no');
    } else if (currentScreen === 'test') {
      if (e.key === 'y' || e.key === 'Y') answerTest('old');        // Yes = appeared
      else if (e.key === 'n' || e.key === 'N') answerTest('new');   // No = did not appear
    }
  });

})();
