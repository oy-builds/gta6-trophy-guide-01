// Leonida Legend — GTA VI trophy guide & tracker.
// Plain browser script, no build step, no network beyond this app's own
// data file. Progress and settings live in localStorage and can be
// exported to / imported from a JSON file.
'use strict';

var STORAGE_KEY = 'leonida-legend-tracker-v1';

var STAGE_TITLES = {
  1: 'The story, watching for missables',
  2: 'Collectibles sweep',
  3: 'Activities, feats and money',
  4: 'The 100% run',
  5: 'The platinum'
};
var STAGE_NOTES = {
  1: 'Play the campaign in order: chapter and mission trophies unlock as you go. The trophies flagged MISSABLE are one-off scenes the story and strands pass by — deal with them on the way, from a manual save, rather than after the ending.',
  2: 'With the map open, sweep Leonida region by region for the tracked collections: counts are on each trophy.',
  3: 'Everything repeatable lives here: strands, races, robberies, feats and the money targets. None of it can be locked away, so it is safe mop-up.',
  4: 'Attain 100% Completion asks for everything the game counts. Use the in-game completion screen to find the category that is short.',
  5: 'Earn the other 54 and the platinum is awarded. There is no separate task.'
};

var trophies = [];
var state = loadState();
var selectedName = null;
var currentView = 'checklist';

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      return {
        earned: parsed.earned || [],
        spoiler: !!parsed.spoiler,
        hideEarned: !!parsed.hideEarned
      };
    }
  } catch (e) { /* corrupted state falls back to a fresh one */ }
  return { earned: [], spoiler: false, hideEarned: false };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isEarned(trophy) {
  return state.earned.indexOf(trophy.name) !== -1;
}

function isShielded(trophy) {
  // The spoiler shield hides story trophies (not the platinum capstone)
  // until they are earned.
  return state.spoiler && trophy.kind === 'story' && trophy.grade !== 'platinum' && !isEarned(trophy);
}

function toggleEarned(trophy) {
  var i = state.earned.indexOf(trophy.name);
  if (i === -1) state.earned.push(trophy.name); else state.earned.splice(i, 1);
  saveState();
  renderAll();
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function makeTag(text, cls) {
  var span = document.createElement('span');
  span.className = 'tag' + (cls ? ' ' + cls : '');
  span.textContent = text;
  return span;
}

function renderProgress() {
  var total = trophies.length;
  var done = trophies.filter(isEarned).length;
  document.getElementById('progress-count').textContent = done + ' of ' + total + ' earned';
  var pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-bar').style.width = pct + '%';
  var parts = ['platinum', 'gold', 'silver', 'bronze'].map(function (g) {
    var all = trophies.filter(function (t) { return t.grade === g; }).length;
    var got = trophies.filter(function (t) { return t.grade === g && isEarned(t); }).length;
    return gradeLabel(g) + ' ' + got + '/' + all;
  });
  document.getElementById('grade-counts').textContent = parts.join(' · ');
  var missables = trophies.filter(function (t) { return t.missable; });
  var missDone = missables.filter(isEarned).length;
  document.getElementById('missable-badge').textContent = missDone + '/' + missables.length;
}

function trophyRow(trophy) {
  var li = document.createElement('li');
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'trophy-row' + (isEarned(trophy) ? ' earned' : '') + (selectedName === trophy.name ? ' selected' : '');

  var box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(trophy);
  box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  box.addEventListener('click', function (ev) { ev.stopPropagation(); });
  box.addEventListener('change', function () { toggleEarned(trophy); });
  btn.appendChild(box);

  var main = document.createElement('span');
  main.className = 'trophy-main';
  var name = document.createElement('span');
  name.className = 'trophy-name';
  var desc = document.createElement('span');
  desc.className = 'trophy-desc';
  if (isShielded(trophy)) {
    name.textContent = '▒▒ Story trophy — spoiler shielded ▒▒';
    name.classList.add('spoiler-name');
    desc.textContent = 'Earn it in game to reveal its name and description.';
    desc.classList.add('spoiler-desc');
  } else {
    name.textContent = trophy.name;
    desc.textContent = trophy.description;
  }
  main.appendChild(name);
  main.appendChild(document.createElement('br'));
  main.appendChild(desc);

  var tags = document.createElement('span');
  tags.className = 'trophy-tags';
  tags.appendChild(makeTag(gradeLabel(trophy.grade), 'grade-' + trophy.grade));
  tags.appendChild(makeTag(trophy.kind));
  if (trophy.count) tags.appendChild(makeTag('Count: ' + trophy.count));
  if (trophy.hidden) tags.appendChild(makeTag('Hidden on PSN', 'hidden-tag'));
  if (trophy.missable) tags.appendChild(makeTag('Missable', 'missable'));
  main.appendChild(tags);
  btn.appendChild(main);

  btn.addEventListener('click', function () {
    selectedName = trophy.name;
    renderAll();
  });
  li.appendChild(btn);
  return li;
}

function filteredTrophies() {
  var q = document.getElementById('search').value.trim().toLowerCase();
  var kind = document.getElementById('kind-filter').value;
  var grade = document.getElementById('grade-filter').value;
  return trophies.filter(function (t) {
    if (kind === 'missable') { if (!t.missable) return false; }
    else if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (state.hideEarned && isEarned(t)) return false;
    if (q) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function renderList() {
  var list = document.getElementById('trophy-list');
  list.replaceChildren();
  var rows = filteredTrophies();
  rows.forEach(function (t) { list.appendChild(trophyRow(t)); });
  document.getElementById('list-summary').textContent =
    'Showing ' + rows.length + ' of ' + trophies.length + ' trophies' +
    (state.spoiler ? ' · Spoiler shield ON: unearned story trophies are hidden.' : '');
}

function renderDetail() {
  var panel = document.getElementById('detail');
  panel.replaceChildren();
  var trophy = null;
  trophies.forEach(function (t) { if (t.name === selectedName) trophy = t; });
  if (!trophy) {
    var hint = document.createElement('p');
    hint.className = 'detail-hint';
    hint.textContent = 'Select a trophy to read its guide and sources.';
    panel.appendChild(hint);
    return;
  }
  var tags = document.createElement('div');
  tags.className = 'trophy-tags';
  tags.appendChild(makeTag(gradeLabel(trophy.grade), 'grade-' + trophy.grade));
  tags.appendChild(makeTag(trophy.kind));
  if (trophy.count) tags.appendChild(makeTag('Tracked count: ' + trophy.count));
  if (trophy.missable) tags.appendChild(makeTag('Missable — flagged', 'missable'));
  panel.appendChild(tags);

  var title = document.createElement('h2');
  var desc = document.createElement('p');
  desc.className = 'official-desc';
  if (isShielded(trophy)) {
    title.textContent = '▒▒ Story trophy — spoiler shielded ▒▒';
    desc.textContent = 'Its official name and description stay hidden until you earn it.';
  } else {
    title.textContent = trophy.name;
    desc.textContent = '“' + trophy.description + '” — official description';
  }
  panel.appendChild(title);
  panel.appendChild(desc);

  var guideHead = document.createElement('h3');
  guideHead.textContent = 'Guide';
  panel.appendChild(guideHead);
  var guide = document.createElement('p');
  guide.textContent = trophy.guide;
  panel.appendChild(guide);

  var srcHead = document.createElement('h3');
  srcHead.textContent = 'Sources';
  panel.appendChild(srcHead);
  var srcList = document.createElement('ul');
  srcList.className = 'sources';
  trophy.sources.forEach(function (s) {
    var li = document.createElement('li');
    li.textContent = s;
    srcList.appendChild(li);
  });
  panel.appendChild(srcList);

  var earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  earnBtn.className = 'earn-btn' + (isEarned(trophy) ? ' earned' : '');
  earnBtn.textContent = isEarned(trophy) ? 'Earned ✓ — tap to undo' : 'Mark as earned';
  earnBtn.addEventListener('click', function () { toggleEarned(trophy); });
  panel.appendChild(earnBtn);
}

function renderRoadmap() {
  var wrap = document.getElementById('roadmap');
  wrap.replaceChildren();
  var intro = document.createElement('p');
  intro.className = 'view-intro';
  intro.textContent = 'The order below is built from the official descriptions: story first with the missable scenes flagged, then the collectible sweep, then the repeatable activities and money targets, then 100% and the platinum. Online: the official list contains no online trophies, so there is no online stage.';
  wrap.appendChild(intro);
  [1, 2, 3, 4, 5].forEach(function (stage) {
    var items = trophies.filter(function (t) { return t.stage === stage; });
    if (!items.length) return;
    var box = document.createElement('section');
    box.className = 'stage';
    var h = document.createElement('h2');
    var num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = 'Stage ' + stage + ' — ';
    h.appendChild(num);
    h.appendChild(document.createTextNode(STAGE_TITLES[stage]));
    box.appendChild(h);
    var note = document.createElement('p');
    note.className = 'stage-note';
    note.textContent = STAGE_NOTES[stage];
    box.appendChild(note);
    var ul = document.createElement('ul');
    items.forEach(function (t) {
      var li = document.createElement('li');
      if (isEarned(t)) li.className = 'done';
      li.textContent = (isShielded(t) ? '▒▒ Story trophy (shielded) ▒▒' : t.name) + ' — ' + gradeLabel(t.grade);
      if (t.missable) {
        var flag = document.createElement('span');
        flag.className = 'flag';
        flag.textContent = ' · Missable';
        li.appendChild(flag);
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
    wrap.appendChild(box);
  });
}

function renderMissables() {
  var list = document.getElementById('missable-list');
  list.replaceChildren();
  trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
    list.appendChild(trophyRow(t));
  });
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function switchView(view) {
  currentView = view;
  ['checklist', 'roadmap', 'missables'].forEach(function (v) {
    document.getElementById('view-' + v).hidden = v !== view;
  });
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.classList.toggle('active', tab.getAttribute('data-view') === view);
  });
  // The toolbar (search, filters, spoiler shield, import/export) stays
  // visible in every view; search and filters act on the checklist.
}

function exportProgress() {
  var payload = {
    app: 'leonida-legend-tracker',
    version: 1,
    earned: state.earned.slice(),
    exportedAt: new Date().toISOString()
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  file.text().then(function (text) {
    var parsed = JSON.parse(text);
    var names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('No earned list in file');
    var valid = {};
    trophies.forEach(function (t) { valid[t.name] = true; });
    state.earned = names.filter(function (n) { return valid[n]; });
    saveState();
    renderAll();
  }).catch(function () {
    alert('That file does not look like exported trophy progress.');
  });
}

function wireControls() {
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () { switchView(tab.getAttribute('data-view')); });
  });
  ['search', 'kind-filter', 'grade-filter'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', renderList);
    document.getElementById(id).addEventListener('change', renderList);
  });
  var spoiler = document.getElementById('spoiler-toggle');
  spoiler.checked = state.spoiler;
  spoiler.addEventListener('change', function () {
    state.spoiler = spoiler.checked;
    saveState();
    renderAll();
  });
  var hideEarned = document.getElementById('hide-earned-toggle');
  hideEarned.checked = state.hideEarned;
  hideEarned.addEventListener('change', function () {
    state.hideEarned = hideEarned.checked;
    saveState();
    renderList();
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', function (ev) {
    if (ev.target.files[0]) importProgress(ev.target.files[0]);
  });
}

function loadTrophies() {
  fetch('data/trophies.json')
    .then(function (res) { return res.json(); })
    .then(function (doc) {
      trophies = doc.trophies;
      if (trophies.length) selectedName = trophies[1].name; // open on a story trophy's guide
      wireControls();
      renderAll();
    })
    .catch(function () {
      document.getElementById('list-summary').textContent = 'Could not load data/trophies.json — serve app/ over HTTP (see README).';
    });
}

loadTrophies();
