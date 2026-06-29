/* ============================================================================
 * se2-results.js — Scoring, chart, and Excel export for Self-Experiment 2
 *
 * Exposes: SE2Results.render(session)
 *
 * DATA ONLY. Student-facing surfaces use NEUTRAL task names ("Vowel task" /
 * "Sentence task") and never name the theory or a predicted direction. The
 * student interprets the numbers in their written report.
 *
 * Definitions (used in scoring and the export):
 *   hit         = a studied word correctly called "Old".
 *   false alarm = a new (distractor) word incorrectly called "Old".
 * ========================================================================== */

var SE2Results = (function () {
  'use strict';

  var chartInstance = null;

  /* Neutral display label for a task code. */
  function taskLabel(task) {
    if (task === 'A') return 'A (vowel task)';
    if (task === 'B') return 'B (sentence task)';
    return '';
  }

  /* ISO 8601 -> friendly local date+time (blank if missing/invalid). */
  function localDateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString();
  }

  /* -----------------------------------------------------------------------
   * SCORING (real trials only)
   * --------------------------------------------------------------------- */
  function score(session) {
    var aRecognized = 0, bRecognized = 0, falseAlarms = 0;

    session.test.forEach(function (item) {
      if (item.type === 'old' && item.response === 'old') {
        if (item.task === 'A') aRecognized += 1;
        else if (item.task === 'B') bRecognized += 1;
      } else if (item.type === 'new' && item.response === 'old') {
        falseAlarms += 1;
      }
    });

    // Denominators are fixed by design: 20 per task, 40 distractors.
    var aTotal = 0, bTotal = 0, newTotal = 0;
    session.study.forEach(function (t) {
      if (t.task === 'A') aTotal += 1; else if (t.task === 'B') bTotal += 1;
    });
    session.test.forEach(function (i) { if (i.type === 'new') newTotal += 1; });

    return {
      aRecognized: aRecognized, bRecognized: bRecognized, falseAlarms: falseAlarms,
      aTotal: aTotal, bTotal: bTotal, newTotal: newTotal
    };
  }

  /* -----------------------------------------------------------------------
   * CHART — two bars, neutral labels, no interpretation.
   * --------------------------------------------------------------------- */
  function renderChart(scored) {
    var canvas = document.getElementById('se2-curve');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Vowel task', 'Sentence task'],
        datasets: [{
          label: 'Recognized as Old',
          data: [scored.aRecognized, scored.bRecognized],
          backgroundColor: '#73000A',
          borderColor: '#73000A',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: scored.aTotal || 20,
            ticks: { precision: 0 },
            title: { display: true, text: 'Words recognized as Old' }
          }
        }
      }
    });
  }

  /* -----------------------------------------------------------------------
   * SUMMARY (plain counts, no interpretation).
   * --------------------------------------------------------------------- */
  function renderSummary(scored) {
    var el = document.getElementById('se2-summary');
    el.innerHTML =
      '<span class="stat">Words from the vowel task recognized as Old: <strong>' +
        scored.aRecognized + ' / ' + scored.aTotal + '</strong></span>' +
      '<span class="stat">Words from the sentence task recognized as Old: <strong>' +
        scored.bRecognized + ' / ' + scored.bTotal + '</strong></span>' +
      '<span class="stat">New words called Old (false alarms): <strong>' +
        scored.falseAlarms + ' / ' + scored.newTotal + '</strong></span>';
  }

  /* -----------------------------------------------------------------------
   * EXCEL WORKBOOK (SheetJS) — six neutral tabs.
   * --------------------------------------------------------------------- */
  function metadataSheet(session, scored) {
    var rows = [];
    rows.push(['Self-Experiment 2: Word Memory']);
    rows.push([]);
    rows.push(['Field', 'Value', 'Local date & time']);
    rows.push(['Participant name', session.participant || 'anonymous', '']);
    rows.push(['App version', SE2_APP_VERSION, '']);
    rows.push(['Session start (ISO 8601)', session.startedISO, localDateTime(session.startedISO)]);
    rows.push(['Study phase opened', session.studyStartISO, localDateTime(session.studyStartISO)]);
    rows.push(['Study phase closed', session.studyEndISO, localDateTime(session.studyEndISO)]);
    rows.push(['Test phase opened', session.testStartISO, localDateTime(session.testStartISO)]);
    rows.push(['Test phase closed', session.testEndISO, localDateTime(session.testEndISO)]);
    rows.push([]);
    rows.push(['Definitions']);
    rows.push(['hit', 'a studied word correctly answered "Old" at test']);
    rows.push(['false alarm', 'a new (distractor) word incorrectly answered "Old" at test']);
    rows.push([]);
    rows.push(['Note: Each word was assigned to a task (vowel or sentence) at random for ' +
               'this participant, so the assignment differs between participants.']);
    rows.push(['Note: All participants completed a required practice round first. Its data ' +
               'is on the separate "Practice" tab and is not included in Scoring or Figure.']);
    return rows;
  }

  function studySheet(session) {
    var rows = [['Order', 'Word', 'Task', 'Orienting question', 'Response',
                 'Vowel count (actual)', 'Response time (ms)',
                 'Shown at (ISO)', 'Shown at (local)']];
    session.study.forEach(function (t) {
      var question = t.task === 'A' ? 'How many vowels?' : t.frame;
      rows.push([t.order, t.word, taskLabel(t.task), question, t.response,
                 t.vowelCount === '' ? '' : t.vowelCount, t.rtMs,
                 t.shownAtISO, localDateTime(t.shownAtISO)]);
    });
    return rows;
  }

  function testSheet(session) {
    var rows = [['Order', 'Word', 'Item type', 'Studied under task', 'Response',
                 'Correct', 'Response time (ms)', 'Shown at (ISO)', 'Shown at (local)']];
    session.test.forEach(function (i) {
      rows.push([i.order, i.word, i.type === 'old' ? 'studied' : 'new',
                 i.task ? taskLabel(i.task) : '',
                 i.response === 'old' ? 'Old' : 'New',
                 i.correct ? 'TRUE' : 'FALSE', i.rtMs,
                 i.shownAtISO, localDateTime(i.shownAtISO)]);
    });
    return rows;
  }

  function scoringSheet(scored) {
    return [
      ['Measure', 'Count', 'Out of'],
      ['Vowel task words recognized as Old', scored.aRecognized, scored.aTotal],
      ['Sentence task words recognized as Old', scored.bRecognized, scored.bTotal],
      ['New words called Old (false alarms)', scored.falseAlarms, scored.newTotal]
    ];
  }

  function figureSheet(scored) {
    return [
      ['Task', 'Recognized as Old'],
      ['Vowel task', scored.aRecognized],
      ['Sentence task', scored.bRecognized]
    ];
  }

  function practiceSheet(session) {
    var rows = [];
    rows.push(['PRACTICE ROUND (warm-up only)']);
    rows.push(['This data is not part of the experiment and is not included in Scoring or Figure.']);
    rows.push([]);
    rows.push(['Order', 'Word', 'Task', 'Orienting question', 'Response',
               'Vowel count (actual)', 'Response time (ms)']);
    session.practice.studyTrials.forEach(function (t) {
      var question = t.task === 'A' ? 'How many vowels?' : t.frame;
      rows.push([t.order, t.word, taskLabel(t.task), question, t.response,
                 t.vowelCount === '' ? '' : t.vowelCount, t.rtMs]);
    });
    return rows;
  }

  function safeName(participant) {
    var cleaned = String(participant || '').replace(/[^A-Za-z0-9_-]/g, '');
    return cleaned.length ? cleaned : 'anonymous';
  }

  function downloadWorkbook(session, scored) {
    if (typeof XLSX === 'undefined') {
      alert('The spreadsheet library could not load (no internet connection?). ' +
            'Please reconnect and try the download again.');
      return;
    }
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metadataSheet(session, scored)), 'Metadata');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(studySheet(session)), 'Study');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(testSheet(session)), 'Test');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(scoringSheet(scored)), 'Scoring');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(figureSheet(scored)), 'Figure');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(practiceSheet(session)), 'Practice');

    var datePart = (session.startedISO || new Date().toISOString()).slice(0, 10);
    var filename = 'self-experiment-2_' + safeName(session.participant) + '_' + datePart + '.xlsx';
    XLSX.writeFile(wb, filename);
  }

  /* -----------------------------------------------------------------------
   * PUBLIC
   * --------------------------------------------------------------------- */
  function render(session) {
    var scored = score(session);
    renderChart(scored);
    renderSummary(scored);
    document.getElementById('download-btn').onclick = function () {
      downloadWorkbook(session, scored);
    };
  }

  return { render: render };
})();
