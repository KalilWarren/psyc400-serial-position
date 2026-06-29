/* ============================================================================
 * se2-stimuli.js — Word pools, sentence frames, and sampling for SE2
 * ============================================================================
 *
 * SE2 is a depth-of-encoding recognition experiment. (Internal note for the
 * instructor/maintainer only — this term never appears in anything the student
 * sees.) Each studied word is encoded under one of two orienting tasks:
 *
 *   Task A — the participant counts the vowels in the word (a shallow,
 *            structural orienting task).
 *   Task B — the participant judges whether the word fits a sentence frame
 *            (a deeper, semantic orienting task).
 *
 * After a filler delay, a surprise recognition test mixes the studied words
 * ("old") with never-seen distractors ("new").
 *
 * ---------------------------------------------------------------------------
 * HOW THE SEMANTIC TASK (B) IS BALANCED  (read before editing frames)
 * ---------------------------------------------------------------------------
 * In Task B, roughly half the items should genuinely FIT (correct answer "Yes")
 * and half should genuinely NOT fit (correct answer "No"), so the task is not
 * dominated by easy "yes" integrations. Because each participant's word->task
 * assignment is random, we cannot know in advance which words land in Task B.
 * We guarantee the balance like this:
 *
 *   • Every REAL_POOL word ships with a FITTING frame (the word fits it -> Yes).
 *   • NONFIT_FRAMES are sentences that require an abstract / emotional word
 *     (e.g. "He felt deeply ____ about the news."). NO concrete noun fits them,
 *     so showing any pool word in such a frame is reliably a "No".
 *   • At runtime, of the 20 words assigned to Task B, exactly 10 are shown in
 *     their own fitting frame (intended "Yes") and 10 in a random NONFIT frame
 *     (intended "No"). This yields a 10/10 split for every participant,
 *     regardless of which words happened to land in Task B.
 *
 * ---------------------------------------------------------------------------
 * HOW TO SWAP THE WORDS  (this is the only file you need to edit)
 * ---------------------------------------------------------------------------
 *   • REAL_POOL: keep at least 40 entries; each is { word, frame } where `frame`
 *     contains the token "____" and the word fits it naturally. 4–7 letter
 *     common concrete nouns work best.
 *   • DISTRACTOR_POOL: keep at least 40 nouns, matched in character, with NO
 *     overlap with REAL_POOL (these are the "new" test items).
 *   • NONFIT_FRAMES: sentences needing an abstract/emotional word (no concrete
 *     noun should fit). Keep at least 10.
 *   • PRACTICE_WORDS / PRACTICE_NONFIT: a small separate warm-up set. Practice
 *     words are automatically excluded from the real study set and the test
 *     distractors at runtime, so they can never appear in the real trial even if
 *     a list is edited to overlap.
 * Save and reload — no other file needs to change.
 * ========================================================================== */

/* Token used for the blank in every sentence frame. */
var SE2_BLANK = '____';

/* --- Real pool: studied words, each with a frame the word FITS (Yes) -------- */
var REAL_POOL = [
  { word: 'anchor',  frame: 'The sailor dropped the ____ into the sea.' },
  { word: 'basket',  frame: 'She filled the ____ with fresh fruit.' },
  { word: 'blanket', frame: 'He pulled the ____ over the sleeping child.' },
  { word: 'bottle',  frame: 'She poured cold water from the ____.' },
  { word: 'bridge',  frame: 'The car drove slowly across the ____.' },
  { word: 'camera',  frame: 'He took a photo with his new ____.' },
  { word: 'candle',  frame: 'She lit a ____ on the dinner table.' },
  { word: 'carpet',  frame: 'They rolled out a new ____ in the hall.' },
  { word: 'castle',  frame: 'The king lived in a stone ____.' },
  { word: 'cabbage', frame: 'The farmer picked a ____ from the field.' },
  { word: 'feather', frame: 'A soft ____ drifted down from the bird.' },
  { word: 'garden',  frame: 'She planted roses in the ____.' },
  { word: 'guitar',  frame: 'He played a song on his ____.' },
  { word: 'hammer',  frame: 'He hit the nail with a ____.' },
  { word: 'helmet',  frame: 'The rider buckled his ____ before the race.' },
  { word: 'island',  frame: 'They sailed out to a small ____.' },
  { word: 'jacket',  frame: 'He zipped up his ____ in the cold.' },
  { word: 'kettle',  frame: 'She boiled some water in the ____.' },
  { word: 'ladder',  frame: 'He climbed the ____ up to the roof.' },
  { word: 'lantern', frame: 'A glowing ____ hung beside the door.' },
  { word: 'magnet',  frame: 'The ____ stuck firmly to the fridge.' },
  { word: 'marble',  frame: 'The child rolled a glass ____.' },
  { word: 'mirror',  frame: 'She looked at herself in the ____.' },
  { word: 'monkey',  frame: 'A ____ swung through the trees.' },
  { word: 'needle',  frame: 'She threaded the ____ with care.' },
  { word: 'pebble',  frame: 'He skipped a flat ____ across the pond.' },
  { word: 'pencil',  frame: 'She sharpened her ____ before class.' },
  { word: 'pillow',  frame: 'He rested his head on the ____.' },
  { word: 'pocket',  frame: 'He kept the coin in his ____.' },
  { word: 'rabbit',  frame: 'A white ____ hopped across the lawn.' },
  { word: 'ribbon',  frame: 'She tied a red ____ in her hair.' },
  { word: 'rocket',  frame: 'The ____ blasted up into the sky.' },
  { word: 'saddle',  frame: 'He placed the ____ on the horse.' },
  { word: 'sandal',  frame: 'She slipped off one ____ at the beach.' },
  { word: 'sponge',  frame: 'He wiped the counter with a ____.' },
  { word: 'tractor', frame: 'The farmer drove the ____ through the field.' },
  { word: 'trumpet', frame: 'She played a tune on the ____.' },
  { word: 'tunnel',  frame: 'The train sped through the ____.' },
  { word: 'turtle',  frame: 'A slow ____ crossed the path.' },
  { word: 'violin',  frame: 'She tuned her ____ before the concert.' },
  { word: 'wagon',   frame: 'The children pulled a little red ____.' },
  { word: 'walnut',  frame: 'He cracked open a ____.' },
  { word: 'window',  frame: 'She opened the ____ for fresh air.' },
  { word: 'button',  frame: 'He sewed a ____ onto the shirt.' },
  { word: 'cricket', frame: 'A ____ chirped softly in the grass.' },
  { word: 'dolphin', frame: 'A ____ leaped from the waves.' },
  { word: 'harbor',  frame: 'The boats rested quietly in the ____.' },
  { word: 'pumpkin', frame: 'She carved a face into the ____.' }
];

/* --- Distractor pool: "new" test items only (must NOT overlap REAL_POOL) ---- */
var DISTRACTOR_POOL = [
  'acorn', 'apron', 'barrel', 'beetle', 'biscuit', 'bucket', 'cactus', 'cannon',
  'cabin', 'collar', 'copper', 'cotton', 'crayon', 'dagger', 'diamond', 'drawer',
  'engine', 'falcon', 'funnel', 'goblet', 'grape', 'hammock', 'igloo', 'jelly',
  'kitten', 'lemon', 'lizard', 'lobster', 'meadow', 'mitten', 'muffin', 'napkin',
  'onion', 'otter', 'parrot', 'peanut', 'pepper', 'pirate', 'puppet', 'quilt',
  'raisin', 'saucer', 'shovel', 'sleigh', 'teapot', 'thimble', 'walrus', 'zebra'
];

/* --- Non-fitting frames: require an abstract/emotional word -> reliably "No" - */
var NONFIT_FRAMES = [
  'He felt deeply ____ about the news.',
  'She was filled with ____ when she heard the result.',
  'The team showed great ____ under pressure.',
  'His apology seemed completely ____.',
  'They acted with remarkable ____ during the crisis.',
  'Her speech was full of ____ and hope.',
  'The agreement depended on mutual ____.',
  'He approached the problem with calm ____.',
  'We were grateful for their ____ and support.',
  'The film left us with a strange sense of ____.',
  'Honesty and ____ matter most to her.',
  'The room was thick with ____ before the verdict.'
];

/* --- Practice set: warm-up only, never reused in the real task -------------- */
var PRACTICE_WORDS = [
  { word: 'spoon', frame: 'He ate his cereal with a ____.' },
  { word: 'broom', frame: 'She swept the floor with a ____.' },
  { word: 'wheel', frame: 'The front ____ of the bike was flat.' },
  { word: 'clock', frame: 'The ____ on the wall struck noon.' },
  { word: 'brush', frame: 'He painted the fence with a ____.' },
  { word: 'chair', frame: 'She sat down on a wooden ____.' }
];
var PRACTICE_NONFIT = [
  'He felt great ____ after winning.',
  'She acted with true ____.',
  'Their plan showed real ____.'
];

/* App version (written into the export). */
var SE2_APP_VERSION = '1.0.0';

/* ---------------------------------------------------------------------------
 * Sampling helpers (no need to edit these to swap words).
 * ------------------------------------------------------------------------- */

/* Shuffled COPY of an array (Fisher–Yates); original untouched. */
function se2Shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* Count vowels (a e i o u; y excluded), case-insensitive. */
function se2VowelCount(word) {
  var m = String(word).toLowerCase().match(/[aeiou]/g);
  return m ? m.length : 0;
}

/* Set of practice words (normalized) so the real task can never reuse them.
 * This is a safety net: even if a practice word is accidentally added to
 * REAL_POOL or DISTRACTOR_POOL when the lists are edited, it is filtered out of
 * the real study set and the test distractors here. */
function se2PracticeWords() {
  var set = {};
  PRACTICE_WORDS.forEach(function (p) { set[String(p.word).trim().toLowerCase()] = true; });
  return set;
}
function se2NotPractice(word, practiceSet) {
  return !practiceSet[String(word).trim().toLowerCase()];
}

/* Build the 40 real study trials for one session:
 *   - draw 40 words from REAL_POOL,
 *   - assign 20 to Task A and 20 to Task B (random, because the pool is shuffled),
 *   - within Task B, mark 10 "fit" (own frame, Yes) and 10 "no-fit" (NONFIT, No),
 *   - return them in a fully shuffled order so A and B interleave unpredictably.
 * Each trial: { word, task:'A'|'B', frame:string|null, intendedFit:'yes'|'no'|null }.
 */
function buildStudySet() {
  // Exclude any practice words from the real pool before drawing (safety net).
  var practice = se2PracticeWords();
  var pool = REAL_POOL.filter(function (item) { return se2NotPractice(item.word, practice); });
  if (pool.length < 40) {
    console.warn('SE2: fewer than 40 real words available after removing practice ' +
                 'words (' + pool.length + '). Add more words to REAL_POOL.');
  }
  var drawn = se2Shuffle(pool).slice(0, 40);
  var study = [];
  for (var i = 0; i < drawn.length; i++) {
    if (i < 20) {
      study.push({ word: drawn[i].word, task: 'A', frame: null, intendedFit: null });
    } else {
      // default Task B as a fitting trial; some are converted to no-fit below
      study.push({ word: drawn[i].word, task: 'B', frame: drawn[i].frame, intendedFit: 'yes' });
    }
  }

  // Of the 20 Task-B trials (indices 20..39), convert a random 10 to no-fit.
  var bIndexes = [];
  for (var k = 20; k < 40; k++) bIndexes.push(k);
  bIndexes = se2Shuffle(bIndexes);
  var noFitFrames = se2Shuffle(NONFIT_FRAMES);
  for (var n = 0; n < 10; n++) {
    var idx = bIndexes[n];
    study[idx].frame = noFitFrames[n];   // 10 distinct non-fit frames (pool has >=12)
    study[idx].intendedFit = 'no';
  }

  return se2Shuffle(study);
}

/* Build the recognition test list: 40 studied ("old", carrying their task) plus
 * 40 sampled distractors ("new"), shuffled into one random order.
 * Each item: { word, type:'old'|'new', task:'A'|'B'|null }. */
function buildTestList(studySet) {
  var old = studySet.map(function (t) {
    return { word: t.word, type: 'old', task: t.task };
  });

  // "New" items must not be practice words, and must not be a studied word.
  var practice = se2PracticeWords();
  var studied = {};
  studySet.forEach(function (t) { studied[String(t.word).trim().toLowerCase()] = true; });
  var pool = DISTRACTOR_POOL.filter(function (w) {
    return se2NotPractice(w, practice) && !studied[String(w).trim().toLowerCase()];
  });
  if (pool.length < 40) {
    console.warn('SE2: fewer than 40 distractors available after removing practice/' +
                 'studied words (' + pool.length + '). Add more words to DISTRACTOR_POOL.');
  }
  var distractors = se2Shuffle(pool).slice(0, 40).map(function (w) {
    return { word: w, type: 'new', task: null };
  });
  return se2Shuffle(old.concat(distractors));
}

/* Build the short practice study set: 6 trials (3 Task A, 3 Task B), with one
 * Task-B trial converted to a no-fit item so both Yes and No are demonstrated.
 * No practice distractors and no practice recognition test (the test stays a
 * surprise). */
function buildPracticeStudy() {
  var p = se2Shuffle(PRACTICE_WORDS);
  var study = [];
  for (var i = 0; i < p.length; i++) {
    if (i < 3) {
      study.push({ word: p[i].word, task: 'A', frame: null, intendedFit: null });
    } else {
      study.push({ word: p[i].word, task: 'B', frame: p[i].frame, intendedFit: 'yes' });
    }
  }
  // Make the last Task-B practice trial a no-fit example.
  study[5].frame = se2Shuffle(PRACTICE_NONFIT)[0];
  study[5].intendedFit = 'no';
  return se2Shuffle(study);
}
