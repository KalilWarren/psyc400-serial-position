/* ============================================================================
 * results.js — Scoring, chart, table, and CSV export.
 *
 * Exposes a single global: Results.render(session)
 *
 * DESIGN NOTE (important, pedagogical): this screen shows DATA ONLY. It must not
 * label primacy/recency regions, name memory systems, or interpret the curve.
 * Interpreting the serial position curve is the student's graded work.
 * ========================================================================== */

var Results = (function () {
  'use strict';

  var chartInstance = null;   // Chart.js instance, kept so we can rebuild cleanly

  /* Normalize for matching: trim surrounding whitespace, lower-case.
   * This is EXACT matching — a misspelled list word (e.g. "biscit") will NOT
   * match and is therefore scored as an intrusion. That is intended: the
   * student should be able to see that in their data. */
  function normalize(s) {
    return s.trim().toLowerCase();
  }

  /* Score one trial (real OR practice). Returns the per-word hit/intrusion
   * events (in typed order), the set of recalled positions (0/1 each), and the
   * raw intrusion words. Used by both real scoring and the Practice sheet. */
  function scoreTrial(trial) {
    var posByWord = {};   // normalized word -> 1-based serial position
    trial.words.forEach(function (w, i) { posByWord[normalize(w)] = i + 1; });

    var matchedPositions = {};   // acts as a Set of positions recalled (0/1)
    var events = [];             // one entry per typed word, in typed order
    var intrusionWords = [];     // raw intrusion words

    trial.recalled.forEach(function (item) {
      // Each recalled item is { word, atISO } (the word and when it was typed).
      var raw = item.word;
      var pos = posByWord[normalize(raw)];
      if (pos) {
        // HIT — every typed occurrence is its own hit-event...
        events.push({ raw: raw, flag: 'hit', position: pos, atISO: item.atISO });
        // ...but a position is "recalled" at most once per trial.
        matchedPositions[pos] = true;
      } else {
        events.push({ raw: raw, flag: 'intrusion', position: '', atISO: item.atISO });
        intrusionWords.push(raw);
      }
    });

    return { matchedPositions: matchedPositions, events: events, intrusionWords: intrusionWords };
  }

  /* -----------------------------------------------------------------------
   * SCORING (real trials only — practice is excluded by design)
   * Produces a single object used by the chart, table, summary, and CSV so
   * every view is guaranteed consistent.
   * --------------------------------------------------------------------- */
  function score(session) {
    var listLength = session.trials[0].words.length;

    // Per-trial results, in trial order (trials[0] = List A, etc.).
    var perTrial = session.trials.map(function (trial) {
      var s = scoreTrial(trial);
      return {
        trial: trial.trial,
        label: trial.label,
        words: trial.words,
        matchedPositions: s.matchedPositions,
        events: s.events,
        intrusionWords: s.intrusionWords,
        presentationStartISO: trial.presentationStartISO,
        recallStartISO: trial.recallStartISO,
        recallEndISO: trial.recallEndISO
      };
    });

    // Per-position totals across the trials (0..number of trials).
    var numTrials = perTrial.length;
    var positions = [];
    for (var p = 1; p <= listLength; p++) {
      var total = 0;
      perTrial.forEach(function (t) {
        if (t.matchedPositions[p]) total += 1;
      });
      positions.push({
        position: p,
        total: total,
        proportion: total / numTrials
      });
    }

    // Overall figures.
    var recalledPositions = positions.reduce(function (sum, p) { return sum + p.total; }, 0);
    var totalPossible = listLength * numTrials;
    var intrusionEvents = perTrial.reduce(function (sum, t) {
      return sum + t.intrusionWords.length;
    }, 0);

    return {
      listLength: listLength,
      numTrials: numTrials,
      perTrial: perTrial,
      positions: positions,
      recalledPositions: recalledPositions,
      totalPossible: totalPossible,
      overallRate: totalPossible ? recalledPositions / totalPossible : 0,
      intrusionEvents: intrusionEvents
    };
  }

  /* -----------------------------------------------------------------------
   * CHART — raw serial position curve (data only, garnet line).
   * --------------------------------------------------------------------- */
  function renderChart(scored) {
    var canvas = document.getElementById('curve');
    if (chartInstance) { chartInstance.destroy(); }

    var labels = scored.positions.map(function (p) { return p.position; });
    var data = scored.positions.map(function (p) { return p.proportion; });

    chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Proportion recalled',
          data: data,
          borderColor: '#73000A',
          backgroundColor: '#73000A',
          pointBackgroundColor: '#73000A',
          borderWidth: 3,
          pointRadius: 4,
          tension: 0,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Serial position' } },
          y: {
            min: 0,
            max: 1,
            ticks: { stepSize: 0.25 },
            title: { display: true, text: 'Proportion recalled' }
          }
        }
      }
    });
  }

  /* -----------------------------------------------------------------------
   * TABLE — per-position words, totals, proportion.
   * --------------------------------------------------------------------- */
  function renderTable(session, scored) {
    var tbody = document.querySelector('#results-table tbody');
    tbody.innerHTML = '';

    // Words per list, indexed by trial order (A, B, C).
    var listWords = session.trials.map(function (t) { return t.words; });

    scored.positions.forEach(function (p, i) {
      var tr = document.createElement('tr');
      var cells = [
        p.position,
        listWords[0] ? listWords[0][i] : '',
        listWords[1] ? listWords[1][i] : '',
        listWords[2] ? listWords[2][i] : '',
        p.total + ' / ' + scored.numTrials,
        p.proportion.toFixed(2)
      ];
      cells.forEach(function (c) {
        var td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  /* -----------------------------------------------------------------------
   * SUMMARY + INTRUSIONS (data only — no interpretation).
   * --------------------------------------------------------------------- */
  function renderSummary(scored) {
    var el = document.getElementById('summary');
    var pct = (scored.overallRate * 100).toFixed(1);
    el.innerHTML =
      '<span class="stat">Overall recall rate: <strong>' + pct + '%</strong> (' +
        scored.recalledPositions + ' of ' + scored.totalPossible + ' positions)</span>' +
      '<span class="stat">Total intrusions: <strong>' + scored.intrusionEvents + '</strong></span>';
  }

  function renderIntrusions(scored) {
    var el = document.getElementById('intrusions');

    // Collect intrusion words with their trial label, in order.
    var items = [];
    scored.perTrial.forEach(function (t) {
      t.intrusionWords.forEach(function (w) {
        items.push({ label: t.label, word: w });
      });
    });

    var html = '<h3>Intrusions</h3>' +
      '<p class="explain">An intrusion is a recalled word that was not on the list you ' +
      'studied. This includes words that were never presented and list words spelled ' +
      'differently enough that they did not match exactly. They are listed below so that ' +
      'you can see which responses were and were not counted.</p>';
    if (items.length === 0) {
      html += '<p class="none">None. Every word you entered matched a word on the lists.</p>';
    } else {
      html += '<div class="chips">';
      items.forEach(function (it) {
        html += '<span class="chip">' + escapeHtml(it.word) +
                ' <small>(' + escapeHtml(it.label) + ')</small></span>';
      });
      html += '</div>';
    }
    el.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* -----------------------------------------------------------------------
   * EXCEL EXPORT — one .xlsx workbook with four sheets:
   *   Metadata · Events · Scoring · Figure
   * Built with SheetJS (global `XLSX`, loaded from CDN). Each sheet is built
   * as an array-of-arrays (rows of cells); numbers stay numeric so Excel and
   * Google Sheets can sort, sum, and chart them directly.
   * --------------------------------------------------------------------- */

  // Convert an ISO 8601 string to a friendly local date + time for readability,
  // alongside the exact ISO value. Returns '' for missing values.
  function localDateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString();
  }

  // --- Sheet 1: Metadata (session info + date/time logs) ------------------
  function metadataSheet(session, scored) {
    var rows = [];
    rows.push(['Serial Position Self-Experiment']);
    rows.push([]);
    rows.push(['Field', 'Value', 'Local date & time']);
    rows.push(['Participant name', session.participant || 'anonymous', '']);
    rows.push(['App version', APP_VERSION, '']);
    rows.push(['Session start (ISO 8601)', session.startedISO, localDateTime(session.startedISO)]);
    rows.push([]);
    rows.push(['Trial timing log (experimental trials only)']);
    rows.push(['Trial', 'List', 'Words shown at (ISO)', 'Words shown at (local)',
               'Recall opened (ISO)', 'Recall opened (local)',
               'Recall closed (ISO)', 'Recall closed (local)']);
    scored.perTrial.forEach(function (t) {
      rows.push([
        t.trial, t.label,
        t.presentationStartISO || '', localDateTime(t.presentationStartISO),
        t.recallStartISO || '', localDateTime(t.recallStartISO),
        t.recallEndISO || '', localDateTime(t.recallEndISO)
      ]);
    });
    rows.push([]);
    rows.push(['Note: All participants completed a required practice trial before the ' +
               'experimental trials. Its data is on the separate "Practice" tab and is not ' +
               'included in the chart, the Scoring tab, or the Figure tab.']);
    rows.push(['Note: The word lists for this session were drawn at random from the ' +
               'study word bank, so they differ between participants. The exact words ' +
               'presented are recorded on the Scoring tab.']);
    rows.push(['Note: An intrusion is a recalled word that was not on the presented list ' +
               '(a non-list word, or a list word spelled differently enough that it did ' +
               'not match exactly).']);
    return rows;
  }

  // --- Practice sheet (the required warm-up; kept SEPARATE from real trials) --
  function practiceSheet(practice) {
    var s = scoreTrial(practice);
    var rows = [];
    rows.push(['PRACTICE TRIAL (warm-up only)']);
    rows.push(['This data is not part of the experiment and is not included in the chart or scoring.']);
    rows.push([]);
    rows.push(['Words shown at (ISO)', practice.presentationStartISO || '', localDateTime(practice.presentationStartISO)]);
    rows.push(['Recall opened (ISO)', practice.recallStartISO || '', localDateTime(practice.recallStartISO)]);
    rows.push(['Recall closed (ISO)', practice.recallEndISO || '', localDateTime(practice.recallEndISO)]);
    rows.push([]);
    rows.push(['Practice words shown (in order)'].concat(practice.words));
    rows.push([]);
    rows.push(['Order typed', 'Recalled word', 'Result', 'Time typed (ISO)', 'Time typed (local)']);
    s.events.forEach(function (ev, idx) {
      rows.push([idx + 1, ev.raw, ev.flag, ev.atISO || '', localDateTime(ev.atISO)]);
    });
    return rows;
  }

  // --- Sheet 2: Events (every typed word, flagged, with time typed) -------
  function eventsSheet(scored) {
    var rows = [['Trial', 'List', 'Order typed', 'Recalled word', 'Result',
                 'Time typed (ISO)', 'Time typed (local)']];
    scored.perTrial.forEach(function (t) {
      t.events.forEach(function (ev, idx) {
        rows.push([t.trial, t.label, idx + 1, ev.raw, ev.flag,
                   ev.atISO || '', localDateTime(ev.atISO)]);
      });
    });
    return rows;
  }

  // --- Sheet 3: Scoring (the on-screen per-position table) ----------------
  function scoringSheet(session, scored) {
    var header = ['Position'];
    session.trials.forEach(function (t) { header.push(t.label + ' word'); });
    session.trials.forEach(function (t) { header.push('Trial ' + t.trial + ' recalled (0/1)'); });
    header.push('Total /' + scored.numTrials, 'Proportion');

    var rows = [header];
    scored.positions.forEach(function (p, i) {
      var row = [p.position];
      session.trials.forEach(function (t) { row.push(t.words[i]); });
      scored.perTrial.forEach(function (t) { row.push(t.matchedPositions[p.position] ? 1 : 0); });
      row.push(p.total, Number(p.proportion.toFixed(4)));   // numeric for Excel
      rows.push(row);
    });
    return rows;
  }

  // --- Sheet 4: Figure (the serial position curve's x/y data) -------------
  function figureSheet(scored) {
    var rows = [['Serial position (x)', 'Proportion recalled (y)']];
    scored.positions.forEach(function (p) {
      rows.push([p.position, Number(p.proportion.toFixed(4))]);   // numeric for charting
    });
    return rows;
  }

  // Sanitize the participant field for use in a filename.
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(eventsSheet(scored)), 'Events');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(scoringSheet(session, scored)), 'Scoring');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(figureSheet(scored)), 'Figure');

    // Practice data goes on its own tab, fully separate from the real trials.
    if (session.practice) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(practiceSheet(session.practice)), 'Practice');
    }

    var datePart = (session.startedISO || new Date().toISOString()).slice(0, 10);
    var filename = 'serialposition_' + safeName(session.participant) + '_' + datePart + '.xlsx';
    XLSX.writeFile(wb, filename);
  }

  /* -----------------------------------------------------------------------
   * PUBLIC: render everything for the results screen.
   * --------------------------------------------------------------------- */
  function render(session) {
    var scored = score(session);

    renderChart(scored);
    renderTable(session, scored);
    renderSummary(scored);
    renderIntrusions(scored);

    var dlBtn = document.getElementById('download-btn');
    dlBtn.onclick = function () { downloadWorkbook(session, scored); };
  }

  return { render: render };
})();
