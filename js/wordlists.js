/* ============================================================================
 * wordlists.js  —  Word banks for the Serial Position Self-Experiment
 * ============================================================================
 *
 * HOW THE WORDS ARE CHOSEN
 * ------------------------
 * There are TWO separate pools of words:
 *
 *   1. REAL_WORD_BANK     — used for the real experiment. At the start of each
 *                           real session the app randomly draws 45 words from
 *                           this bank and splits them into three 15-word lists
 *                           (List A, B, C). Different students see different
 *                           words, but the experiment design is identical.
 *
 *   2. PRACTICE_WORD_BANK — used ONLY for the optional practice / dry run. These
 *                           words NEVER appear in the real experiment, so a
 *                           student can try the site out without being exposed
 *                           to the stimuli they will later be tested on.
 *
 * The two banks must NOT share any words — that separation is what keeps a
 * practice run from contaminating real results.
 *
 * FOR THE INSTRUCTOR — HOW TO CHANGE THE WORDS
 * --------------------------------------------
 * This file is the ONLY place you need to edit. Rules to keep it valid:
 *   • REAL_WORD_BANK must have AT LEAST 45 words (3 lists x 15). More is better —
 *     a larger bank means more variety between students.
 *   • PRACTICE_WORD_BANK must have AT LEAST PRACTICE_LIST_LENGTH words (10), and
 *     must not overlap REAL_WORD_BANK.
 *   • Use single, common, concrete nouns. Avoid duplicates and avoid words that
 *     are easy misspellings of one another.
 * Save the file and reload the page — no other file needs to change.
 * ========================================================================== */

/* How many lists the real experiment uses, and how long each list is. */
const REAL_LIST_COUNT      = 3;
const LIST_LENGTH          = 15;   // words per real list (serial positions 1..15)
const PRACTICE_LIST_LENGTH = 10;   // words in the short practice list

/* ---------------------------------------------------------------------------
 * REAL word bank — the real experiment draws 45 of these at random per session.
 * ------------------------------------------------------------------------- */
const REAL_WORD_BANK = [
  'river', 'candle', 'tractor', 'velvet', 'monkey', 'pillow', 'anchor', 'blanket',
  'lantern', 'cabbage', 'trumpet', 'saddle', 'biscuit', 'marble', 'feather',
  'copper', 'garden', 'whistle', 'pencil', 'harbor', 'sandal', 'cricket', 'mirror',
  'walnut', 'tunnel', 'ribbon', 'kettle', 'mountain', 'puppet', 'onion',
  'pepper', 'wagon', 'helmet', 'sponge', 'jacket', 'needle', 'pebble', 'compass',
  'apricot', 'ladder', 'bottle', 'glacier', 'violin', 'carpet', 'beetle',
  'hammer', 'button', 'rocket', 'turtle', 'basket', 'mitten', 'pumpkin', 'dolphin',
  'barrel', 'cactus', 'magnet', 'island', 'jungle', 'kitten', 'lobster',
  'meadow', 'napkin', 'orchard', 'parrot', 'quilt', 'rabbit', 'sausage', 'teapot',
  'umbrella', 'vulture', 'walrus', 'yogurt', 'zebra', 'badge', 'cobweb',
  'engine', 'falcon', 'goblet', 'iceberg', 'jelly', 'koala', 'lemon', 'muffin',
  'noodle', 'otter', 'peacock', 'raisin', 'satchel', 'thistle', 'hedgehog'
];

/* ---------------------------------------------------------------------------
 * PRACTICE word bank — reserved for the dry run; never used in the real run.
 * ------------------------------------------------------------------------- */
const PRACTICE_WORD_BANK = [
  'acorn', 'dragon', 'igloo', 'bucket', 'anvil', 'comet', 'donut', 'eagle',
  'fountain', 'guitar', 'hammock', 'kazoo', 'llama', 'nugget', 'pillar',
  'sleigh', 'trophy', 'wizard'
];

/* App version — bump this if you change how the experiment works. It is written
 * into the export so data files can be traced to a version. */
const APP_VERSION = '1.1.0';

/* ---------------------------------------------------------------------------
 * Sampling helpers (no need to edit these to swap words).
 * ------------------------------------------------------------------------- */

/* Return a shuffled COPY of an array (Fisher–Yates); the original is untouched. */
function shuffleCopy(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

/* Build the three real lists for one session by drawing 45 distinct words at
 * random from REAL_WORD_BANK and splitting them into List A / B / C. */
function buildRealLists() {
  var needed = REAL_LIST_COUNT * LIST_LENGTH;
  var pool = shuffleCopy(REAL_WORD_BANK).slice(0, needed);
  var labels = ['List A', 'List B', 'List C', 'List D', 'List E'];
  var lists = [];
  for (var t = 0; t < REAL_LIST_COUNT; t++) {
    lists.push({
      label: labels[t] || ('List ' + (t + 1)),
      trial: t + 1,
      words: pool.slice(t * LIST_LENGTH, (t + 1) * LIST_LENGTH)
    });
  }
  return lists;
}

/* Build the single short practice list from the reserved practice bank. */
function buildPracticeList() {
  return {
    label: 'Practice',
    trial: 0,
    words: shuffleCopy(PRACTICE_WORD_BANK).slice(0, PRACTICE_LIST_LENGTH)
  };
}
