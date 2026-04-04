// ─── State ──────────────────────────────────────────────────────────────────
const DAYS = 7;
let currentScreen = 0;
const answers = {};
let nextDayNumber = 0;

function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Navigation ─────────────────────────────────────────────────────────────
function goTo(id) {
  const oldId = typeof currentScreen === 'number'
    ? 's' + currentScreen
    : currentScreen;
  const el = document.getElementById(oldId);
  if (el) el.classList.remove('on');

  currentScreen = id;

  const newId = typeof id === 'number' ? 's' + id : id;
  const newEl = document.getElementById(newId);
  if (newEl) newEl.classList.add('on');

  window.scrollTo(0, 0);

  if (typeof id === 'number' && id >= 1 && id <= DAYS) {
    updateProgress(id);
  } else {
    document.getElementById('prog').style.display = 'none';
  }
}

function updateProgress(n) {
  const prog = document.getElementById('prog');
  if (n >= 1 && n <= DAYS) {
    prog.style.display = 'flex';
    prog.innerHTML = '';
    for (let i = 1; i <= DAYS; i++) {
      const seg = document.createElement('div');
      seg.className = 'prog-seg' + (i < n ? ' done' : i === n ? ' active' : '');
      prog.appendChild(seg);
    }
  } else {
    prog.style.display = 'none';
  }
}

// ─── Entry points ────────────────────────────────────────────────────────────
function startOrientatie() { goTo(1); }
function startActie()      { goTo(13); }

// ─── Input validation ────────────────────────────────────────────────────────
function chk(fieldId, btnId) {
  const val = document.getElementById(fieldId).value.trim();
  document.getElementById(btnId).disabled = val.length < 3;
}

// ─── Save day answer ─────────────────────────────────────────────────────────
function saveDay(n) {
  const val = document.getElementById('a' + n).value.trim();
  answers['dag' + n] = val;
  save('answers', answers);

  document.getElementById('done-title').textContent = 'Dag ' + n + ' afgerond.';
  document.getElementById('done-sub').textContent = n < DAYS
    ? 'Er wacht een volgende stap, wanneer jij er klaar voor bent.'
    : 'Je hebt alle zeven dagen gedaan.';

  nextDayNumber = n < DAYS ? n + 1 : 0;
  const nextWrap = document.getElementById('next-day-wrap');
  if (nextWrap) nextWrap.style.display = nextDayNumber > 0 ? 'block' : 'none';

  renderLog();
  goTo(12);
}

function goToNextDay() {
  if (nextDayNumber > 0 && nextDayNumber <= DAYS) {
    goTo(nextDayNumber);
  }
}

// ─── Render logboek ──────────────────────────────────────────────────────────
function renderLog() {
  const logEl = document.getElementById('log-wrap');
  const all = load('answers') || {};

  const sprint1 = Object.entries(all).filter(([k]) => k.startsWith('dag'));
  const sprint2 = Object.entries(all).filter(([k]) => k.startsWith('r'));

  if (sprint1.length === 0 && sprint2.length === 0) { logEl.innerHTML = ''; return; }

  let html = '';

  if (sprint1.length > 0) {
    html += '<div class="log-label" style="margin-bottom:0.75rem;">Sprint 1</div>';
    html += sprint1.map(([k, v]) =>
      '<div class="log-entry">' +
        '<div class="log-label">' + k.replace('dag', 'Dag ') + '</div>' +
        '<div class="log-text">' + v + '</div>' +
      '</div>'
    ).join('');
  }

  if (sprint2.length > 0) {
    html += '<div class="log-label" style="margin:1rem 0 0.75rem;">Sprint 2</div>';
    html += sprint2.map(([k, v]) =>
      '<div class="log-entry">' +
        '<div class="log-label">Dag ' + k.replace('r', '') + '</div>' +
        '<div class="log-text">' + v + '</div>' +
      '</div>'
    ).join('');
  }

  const ideeAnswers = Object.entries(all)
    .filter(([k]) => k.startsWith('i') && !isNaN(parseInt(k.replace('i', ''))));

  if (ideeAnswers.length > 0) {
    html += '<div class="log-label" style="margin:1rem 0 0.75rem;">Idee Sprint</div>';
    html += ideeAnswers.map(([k, v]) =>
      '<div class="log-entry">' +
        '<div class="log-label">Dag ' + k.replace('i', '') + '</div>' +
        '<div class="log-text">' + v + '</div>' +
      '</div>'
    ).join('');
  }

  logEl.innerHTML = html;
}

// ─── Generate summary (dag 7) ─────────────────────────────────────────────────
async function generateSummary() {
  const val = document.getElementById('a7').value.trim();
  answers['dag7'] = val;
  save('answers', answers);
  goTo(8);

  const all = load('answers') || {};
  const context = Object.entries(all)
    .filter(([k]) => k.startsWith('dag'))
    .map(([k, v]) => k.replace('dag', 'Dag ') + ': "' + v + '"')
    .join('\n');

  const prompt =
    'Je schrijft een korte, warme reflectie. Drie delen. Vloeiende tekst.\n\n' +

    'DEEL 1 — REFLECTIE (max 2 zinnen)\n' +
    'Wat zie je terug in de antwoorden?\n' +
    'Concreet. Geen interpretatie. Geen psychologische analyse.\n' +
    'Gebruik woorden als: "het lijkt", "misschien", "het voelt alsof"\n\n' +

    'DEEL 2 — RICHTING (max 2 zinnen)\n' +
    'Waar lijkt dit heen te bewegen?\n' +
    'Klein en open. Niet "dit moet je doen". Wel: "hier lijkt iets te zitten"\n\n' +

    'DEEL 3 — EERSTE KLEINE STAP (exact 1 zin)\n' +
    'Één concrete actie. Direct uitvoerbaar. Max 15 minuten.\n' +
    'Geen voorbereiding nodig.\n' +
    'Altijd: één persoon OF één object (een werk, een zin, een idee)\n' +
    'Nooit: abstracte stappen, meerdere opties, "denk na over"\n\n' +

    'TOTALE LENGTE: maximaal 80 woorden\n\n' +

    'FORMATTING:\n' +
    '- Geen markdown (geen #, geen *, geen -)\n' +
    '- Geen titels of headers\n' +
    '- Geen opsommingen\n' +
    '- Gewone lopende tekst\n' +
    '- Twee alinea-omscheidingen tussen de drie delen\n\n' +

    'VERBODEN WOORDEN:\n' +
    '"je moet", "je bent iemand die", "dit betekent dat"\n' +
    '"business", "product", "klant", "valideren", "pitch", "markt"\n' +
    '"kijk eens wat", "ontdek", "verken"\n\n' +

    'VOORBEELD VAN DE JUISTE TOON EN LENGTE:\n' +
    '"Je komt steeds terug bij het verlangen om je werk te laten zien — ' +
    'niet alleen voor jezelf, maar omdat je voelt dat het iets kan betekenen voor anderen.\n\n' +
    'Het lijkt minder te gaan om een grote stap, en meer om een moment waarop ' +
    'iemand jouw werk ziet en er iets in herkent.\n\n' +
    'Als je ergens klein begint, zou het dit kunnen zijn: kies één werk en laat ' +
    'het aan één persoon zien, gewoon om te zien wat het oproept."\n\n' +

    'ANTWOORDEN VAN DE GEBRUIKER:\n' +
    context;

  try {
    const res = await fetch('/api/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    document.getElementById('summary-text').textContent = stripMarkdown(data.content[0].text);
  } catch (err) {
    document.getElementById('summary-text').textContent =
      'Er lijkt iets te zitten in wat je hebt opgeschreven.\n\n' +
      'Neem even de tijd om je antwoorden terug te lezen.\n\n' +
      'Kies één antwoord dat het meest bij je bleef hangen en schrijf er één zin over op.';
  }

  goTo(9);
}

// ─── Actie Sprint dag 1 ───────────────────────────────────────────────────────
function saveActieDay1() {
  const val = document.getElementById('a13').value.trim();
  answers['actie_dag1'] = val;
  save('answers', answers);
  document.getElementById('done-title').textContent = 'Eerste stap gezet.';
  document.getElementById('done-sub').textContent = 'Er wacht een volgende stap, wanneer jij er klaar voor bent.';
  document.getElementById('log-wrap').innerHTML =
    '<div class="log-entry">' +
      '<div class="log-label">Dag 1</div>' +
      '<div class="log-text">' + val + '</div>' +
    '</div>';
  goTo(12);
}

// ─── Idee Sprint ─────────────────────────────────────────────────────────────

const ideeDayToScreen = {
  1: 's-i1', 2: 's-i2', 3: 's-i3', 4: 's-i4',
  5: 's-i5', 6: 's-i6', 7: 's-i7'
};

function startIdeeSprint() {
  updateIdeeProgress(1);
  goTo('s-i1');
}

function updateIdeeProgress(dayNum) {
  const prog = document.getElementById('prog');
  prog.style.display = 'flex';
  prog.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const seg = document.createElement('div');
    seg.className = 'prog-seg' +
      (i < dayNum ? ' done' : i === dayNum ? ' active' : '');
    prog.appendChild(seg);
  }
}

function saveIdeeDay(n) {
  const val = document.getElementById('i' + n).value.trim();
  answers['i' + n] = val;
  save('answers', answers);

  document.getElementById('done-title').textContent = 'Dag ' + n + ' afgerond.';
  document.getElementById('done-sub').textContent =
    'Er wacht een volgende stap, wanneer jij er klaar voor bent.';

  const nextDayWrap = document.getElementById('next-day-wrap');
  const btnNext = document.getElementById('btn-next-day');

  if (n < 7) {
    nextDayNumber = n + 1;
    nextDayWrap.style.display = 'block';
    btnNext.onclick = function() {
      const nextScreen = ideeDayToScreen[nextDayNumber];
      if (nextScreen) {
        updateIdeeProgress(nextDayNumber);
        goTo(nextScreen);
      }
    };
  } else {
    nextDayWrap.style.display = 'none';
  }

  renderLog();
  goTo(12);
}

async function generateIdeeSummary() {
  const val = document.getElementById('i7').value.trim();
  answers['i7'] = val;
  save('answers', answers);
  goTo('s-iloading');

  const all = load('answers') || {};

  const ideeAnswers = Object.entries(all)
    .filter(([k]) => k.startsWith('i') && !isNaN(parseInt(k.replace('i', ''))))
    .map(([k, v]) => 'Dag ' + k.replace('i', '') + ': "' + v + '"')
    .join('\n');

  const prompt =
    'Je schrijft een korte, warme reflectie. Drie delen. Vloeiende tekst.\n\n' +

    'De gebruiker heeft een idee en heeft zeven dagen vragen beantwoord.\n\n' +

    'DEEL 1 — REFLECTIE (max 2 zinnen)\n' +
    'Wat zie je terug in de antwoorden?\n' +
    'Concreet. Geen interpretatie. Geen psychologische analyse.\n' +
    'Gebruik woorden als: "het lijkt", "misschien", "het voelt alsof"\n\n' +

    'DEEL 2 — RICHTING (max 2 zinnen)\n' +
    'Waar lijkt dit heen te bewegen?\n' +
    'Klein en open. Niet "dit moet je doen". Wel: "hier lijkt iets te zitten"\n\n' +

    'DEEL 3 — EERSTE KLEINE STAP (exact 1 zin)\n' +
    'Één concrete actie. Direct uitvoerbaar. Max 15 minuten.\n' +
    'Altijd: één persoon OF één object (een werk, een zin, een idee)\n' +
    'Nooit: abstracte stappen, meerdere opties, "denk na over"\n\n' +

    'TOTALE LENGTE: maximaal 80 woorden\n\n' +

    'FORMATTING:\n' +
    '- Geen markdown (geen #, geen *, geen -)\n' +
    '- Geen titels of headers\n' +
    '- Gewone lopende tekst\n' +
    '- Twee alinea-omscheidingen tussen de drie delen\n\n' +

    'VERBODEN WOORDEN:\n' +
    '"je moet", "je bent iemand die", "dit betekent dat"\n' +
    '"business", "product", "klant", "valideren", "pitch", "markt"\n\n' +

    'ANTWOORDEN:\n' + ideeAnswers;

  try {
    const res = await fetch('/api/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    document.getElementById('idee-summary-text').textContent =
      stripMarkdown(data.content[0].text);
  } catch (err) {
    document.getElementById('idee-summary-text').textContent =
      'Er lijkt iets te zitten in wat je hebt opgeschreven.\n\n' +
      'Neem even de tijd om je antwoorden terug te lezen.\n\n' +
      'Kies één antwoord dat het meest bij je bleef hangen en schrijf er één zin over op.';
  }

  goTo('s-isummary');
}

// ─── Refinement Sprint ────────────────────────────────────────────────────────

const refinementDayToScreen = {
  8: 's-r8', 9: 's-r9', 10: 's-r10', 11: 's-r11',
  12: 's-r12', 13: 's-r13', 14: 's-r14'
};

function startRefinementSprint() {
  updateRefinementProgress(8);
  goTo('s-r8');
}

function updateRefinementProgress(dayNum) {
  const prog = document.getElementById('prog');
  prog.style.display = 'flex';
  prog.innerHTML = '';
  for (let i = 8; i <= 14; i++) {
    const seg = document.createElement('div');
    seg.className = 'prog-seg' +
      (i < dayNum ? ' done' : i === dayNum ? ' active' : '');
    prog.appendChild(seg);
  }
}

function saveRefinementDay(n) {
  const val = document.getElementById('r' + n).value.trim();
  answers['r' + n] = val;
  save('answers', answers);

  document.getElementById('done-title').textContent = 'Dag ' + n + ' afgerond.';
  document.getElementById('done-sub').textContent =
    'Er wacht een volgende stap, wanneer jij er klaar voor bent.';

  const nextDayWrap = document.getElementById('next-day-wrap');
  const btnNext = document.getElementById('btn-next-day');

  if (n < 14) {
    nextDayNumber = n + 1;
    nextDayWrap.style.display = 'block';
    btnNext.onclick = function() {
      const nextScreen = refinementDayToScreen[nextDayNumber];
      if (nextScreen) {
        updateRefinementProgress(nextDayNumber);
        goTo(nextScreen);
      }
    };
  } else {
    nextDayWrap.style.display = 'none';
  }

  renderLog();
  goTo(12);
}

async function generateRefinementSummary() {
  const val = document.getElementById('r14').value.trim();
  answers['r14'] = val;
  save('answers', answers);
  goTo('s-rloading');

  const all = load('answers') || {};

  const sprint1 = Object.entries(all)
    .filter(([k]) => {
      const n = parseInt(k.replace('dag', ''));
      return !isNaN(n) && n >= 1 && n <= 7;
    })
    .map(([k, v]) => 'Dag ' + k.replace('dag', '') + ': "' + v + '"')
    .join('\n');

  const sprint2 = Object.entries(all)
    .filter(([k]) => k.startsWith('r'))
    .map(([k, v]) => 'Dag ' + k.replace('r', '') + ': "' + v + '"')
    .join('\n');

  const prompt =
    'Je bent een rustige spiegel. Geen coach, geen adviseur.\n\n' +
    'Schrijf een reflectie in exact 3 onderdelen. Geen markdown. Geen bullets. Geen koppen.\n' +
    'Alleen doorlopende tekst. Maximaal 80 woorden totaal.\n\n' +
    'SPRINT 1 antwoorden (dag 1–7):\n' + sprint1 + '\n\n' +
    'SPRINT 2 antwoorden (dag 8–14):\n' + sprint2 + '\n\n' +
    'Deel 1 — Reflectie (wat je terugziet in de antwoorden, gebruik hun eigen woorden)\n' +
    'Deel 2 — Richting (wat er voorzichtig begint op te lijken, geen conclusies)\n' +
    'Deel 3 — Actie (één kleine concrete stap die morgen past, geen druk)\n\n' +
    'Verboden: "je moet", "je zou", "product", "klant", "valideren", "business", "ondernemen", markdown-tekens.\n' +
    'Begin direct. Geen inleiding.';

  try {
    const res = await fetch('/api/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    document.getElementById('refinement-summary-text').textContent =
      stripMarkdown(data.content[0].text);
  } catch (err) {
    document.getElementById('refinement-summary-text').textContent =
      'Na twee weken zie je iets concreter worden. Lees je antwoorden terug — de richting zit er al in. Kies één ding dat je deze week klein kunt uitproberen.';
  }

  goTo('s-rsummary');
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
function save(key, value) {
  try { localStorage.setItem('ds_' + key, JSON.stringify(value)); } catch (e) {}
}

function load(key) {
  try { return JSON.parse(localStorage.getItem('ds_' + key)); } catch (e) { return null; }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(function init() {
  const saved = load('answers');
  if (saved) Object.assign(answers, saved);
})();
