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

// ─── Vraagvarianten ──────────────────────────────────────────────────────────
const orientatieVariants = {
  1: [
    'Waar merk je dat je makkelijk over praat — of over na blijft denken?',
    'Waar word je vanzelf enthousiast van als het ter sprake komt?'
  ],
  2: [
    'Als je hier iets langer bij stilstaat — wat maakt dit interessant voor jou?',
    'Wat maakt dat dit onderwerp je blijft bezighouden?'
  ],
  3: [
    'Wie is iemand die dit ook herkent — of hier iets aan zou kunnen hebben?',
    'Als jij dit aan iemand zou vertellen — wie schiet er dan in je op?'
  ],
  4: [
    'Als je dit klein maakt — wat zou je hiermee kunnen doen?',
    'Hoe zou dit er in zijn simpelste vorm uitzien?'
  ],
  5: [
    'Wat is één kleine stap die je hiermee zou kunnen zetten?',
    'Als je één ding zou doen — hoe klein ook — wat zou dat zijn?'
  ],
  6: [
    'Wat maakt dit nog een beetje spannend of lastig?',
    'Wat houdt je nog een beetje tegen — ook als het maar klein is?'
  ],
  7: [
    'Als je dit in één zin zou delen met iemand — wat zou je zeggen?',
    'Hoe zou je dit uitleggen aan iemand die je vertrouwt?'
  ]
};

const ideeVariants = {
  1: [
    'Waarom blijft dit idee terugkomen bij je?',
    'Wat maakt dat je dit idee niet loslaat?'
  ],
  2: [
    'Wie is één persoon die hier iets aan zou kunnen hebben?',
    'Voor wie zou dit het meeste betekenen?'
  ],
  3: [
    'Wanneer zou iemand dit nodig hebben? In welk moment of situatie?',
    'In welke situatie denk je: hier had ik iets voor willen hebben?'
  ],
  4: [
    'Als je dit heel simpel zou maken — hoe zou dat eruitzien?',
    'Wat is de meest eenvoudige vorm die je je kunt voorstellen?'
  ],
  5: [
    'Stel je legt dit uit in één zin — wat zeg je?',
    'Hoe zou jij dit in één zin omschrijven aan iemand die je kent?'
  ],
  6: [
    'Schrijf die zin alsof je hem zou sturen.',
    'Schrijf het op zoals je het in een bericht zou zetten.'
  ],
  7: [
    'Wat merkte je toen je dit opschreef of deelde?',
    'Hoe voelde het om dit de afgelopen dagen te verkennen?'
  ]
};

function updateDay7Share() {
  const shareBtn = document.getElementById('btn-share-day7');
  if (shareBtn) {
    shareBtn.style.display =
      document.getElementById('a7').value.trim().length >= 5
      ? 'block' : 'none';
  }
}

function markAsShared() {
  answers['dag7_shared'] = true;
  save('answers', answers);
  const btn = document.getElementById('btn-share-day7');
  if (btn) {
    btn.textContent = 'Genoteerd \u2713';
    btn.disabled = true;
  }
}

function setRandomVariant(screenId, variants, dayNum) {
  const screen = document.getElementById(screenId);
  if (!screen) return;
  const qEl = screen.querySelector('.q');
  if (!qEl) return;
  const options = variants[dayNum];
  if (!options || options.length === 0) return;
  const chosen = options[Math.floor(Math.random() * options.length)];
  const soft = qEl.querySelector('.q-soft');
  qEl.textContent = chosen;
  if (soft) qEl.appendChild(soft);
}

function showContextAnchor(screenId, previousKey) {
  const all = load('answers') || {};
  const prev = all[previousKey];
  if (!prev || prev.length < 5) return;
  const screen = document.getElementById(screenId);
  if (!screen) return;
  const existing = screen.querySelector('.context-anchor');
  if (existing) existing.remove();
  const words = prev.trim().split(' ').slice(0, 12).join(' ');
  const anchor = document.createElement('p');
  anchor.className = 'context-anchor';
  anchor.textContent = '\u201c' + words + (prev.split(' ').length > 12 ? '\u2026' : '') + '\u201d';
  const textarea = screen.querySelector('textarea');
  if (textarea) screen.insertBefore(anchor, textarea);
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

  const screenKey = typeof id === 'number' ? 's' + id : id;

  // Contextankers
  const anchorMap = {
    's2': 'dag1', 's3': 'dag2', 's4': 'dag3',
    's5': 'dag4', 's6': 'dag5', 's7': 'dag6'
  };
  const ideeAnchorMap = {
    's-i2': 'i1', 's-i3': 'i2', 's-i4': 'i3',
    's-i5': 'i4', 's-i6': 'i5', 's-i7': 'i6'
  };
  if (anchorMap[screenKey]) showContextAnchor(screenKey, anchorMap[screenKey]);
  if (ideeAnchorMap[screenKey]) showContextAnchor(screenKey, ideeAnchorMap[screenKey]);

  // Vraagvarianten
  const orientatieScreens = {
    's1': 1, 's2': 2, 's3': 3, 's4': 4, 's5': 5, 's6': 6, 's7': 7
  };
  const ideeScreens = {
    's-i1': 1, 's-i2': 2, 's-i3': 3, 's-i4': 4,
    's-i5': 5, 's-i6': 6, 's-i7': 7
  };
  if (orientatieScreens[screenKey] !== undefined) {
    setRandomVariant(screenKey, orientatieVariants, orientatieScreens[screenKey]);
  }
  if (ideeScreens[screenKey] !== undefined) {
    setRandomVariant(screenKey, ideeVariants, ideeScreens[screenKey]);
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

  const w3Answers = Object.entries(all)
    .filter(([k]) => k.startsWith('w3d'));

  if (w3Answers.length > 0) {
    html += '<div class="log-label" style="margin:1rem 0 0.75rem;">Sprint 3</div>';
    html += w3Answers.map(([k, v]) =>
      '<div class="log-entry">' +
        '<div class="log-label">Dag ' + k.replace('w3d', '') + '</div>' +
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
    'Je schrijft een korte, warme reflectie na 7 dagen. Drie delen. Vloeiende tekst.\n\n' +

    'De gebruiker doorliep deze vragen:\n' +
    '- Dag 1: waar ze makkelijk over praten\n' +
    '- Dag 2: wat dat interessant maakt voor hen\n' +
    '- Dag 3: wie dit herkent\n' +
    '- Dag 4: een eerste simpele vorm\n' +
    '- Dag 5: één kleine stap\n' +
    '- Dag 6: wat het nog lastig maakt\n' +
    '- Dag 7: één zin om te delen\n\n' +

    'STRUCTUUR (altijd drie alineas):\n\n' +

    'Alinea 1 — Reflectie (max 2 zinnen):\n' +
    'Wat zie je terug? Gebruik hun eigen woorden.\n' +
    'Gebruik: "het lijkt", "misschien", "het voelt alsof"\n\n' +

    'Alinea 2 — Richting (max 2 zinnen):\n' +
    'Waar lijkt dit heen te bewegen? Klein en open.\n' +
    'Niet "dit moet je doen". Wel: "hier lijkt iets te zitten"\n\n' +

    'Alinea 3 — Eerste stap (exact 1 zin):\n' +
    'Één concrete actie. Direct uitvoerbaar. Max 15 minuten.\n' +
    'Altijd: één persoon OF één object.\n' +
    'NOOIT: abstracte stappen, "denk na over", meerdere opties.\n\n' +

    'TOTALE LENGTE: maximaal 80 woorden\n\n' +

    'FORMATTING: geen markdown, geen headers, geen bullets\n\n' +

    'VERBODEN: "je moet", "je bent iemand die", "business",\n' +
    '"product", "klant", "valideren", "pitch", "markt"\n\n' +

    'ANTWOORDEN:\n' + context;

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

// ─── Sprint 3: Eerste Beweging ────────────────────────────────────────────────

const w3DayToScreen = {
  15: 's-w3-15', 16: 's-w3-16', 17: 's-w3-17', 18: 's-w3-18',
  19: 's-w3-19', 20: 's-w3-20', 21: 's-w3-21'
};

function startW3Sprint() {
  updateW3Progress(15);
  goTo('s-w3-15');
}

function updateW3Progress(dayNum) {
  const prog = document.getElementById('prog');
  prog.style.display = 'flex';
  prog.innerHTML = '';
  for (let i = 15; i <= 21; i++) {
    const seg = document.createElement('div');
    seg.className = 'prog-seg' +
      (i < dayNum ? ' done' : i === dayNum ? ' active' : '');
    prog.appendChild(seg);
  }
}

function saveW3Day(n) {
  const val = document.getElementById('w3d' + n).value.trim();
  answers['w3d' + n] = val;
  save('answers', answers);

  document.getElementById('done-title').textContent = 'Dag ' + n + ' afgerond.';
  document.getElementById('done-sub').textContent =
    'Er wacht een volgende stap, wanneer jij er klaar voor bent.';

  const nextDayWrap = document.getElementById('next-day-wrap');
  const btnNext = document.getElementById('btn-next-day');

  if (n < 21) {
    nextDayNumber = n + 1;
    nextDayWrap.style.display = 'block';
    btnNext.onclick = function() {
      const nextScreen = w3DayToScreen[nextDayNumber];
      if (nextScreen) {
        updateW3Progress(nextDayNumber);
        goTo(nextScreen);
      }
    };
  } else {
    nextDayWrap.style.display = 'none';
  }

  renderLog();
  goTo(12);
}

async function generateW3Summary() {
  const val = document.getElementById('w3d21').value.trim();
  answers['w3d21'] = val;
  save('answers', answers);
  goTo('s-w3-loading');

  const all = load('answers') || {};

  const w3Answers = Object.entries(all)
    .filter(([k]) => k.startsWith('w3d'))
    .map(([k, v]) => 'Dag ' + k.replace('w3d', '') + ': "' + v + '"')
    .join('\n');

  const allPrevious = Object.entries(all)
    .filter(([k]) => !k.startsWith('w3d'))
    .map(([k, v]) => k + ': "' + v + '"')
    .join('\n');

  const prompt =
    'Je schrijft een korte, warme reflectie na drie weken.\n\n' +

    'De gebruiker heeft de eerste twee weken richting gevonden en verfijnd.\n' +
    'In week 3 maakten ze voor het eerst contact met de werkelijkheid:\n' +
    '- Ze verkenden hoe het eruit zou zien voor één persoon\n' +
    '- Ze formuleerden wat ze zouden zeggen\n' +
    '- Ze zetten een eerste stap — hoe klein ook\n' +
    '- Ze reflecteerden op hoe dat voelde\n' +
    '- Ze kozen of ze willen herhalen of aanpassen\n\n' +

    'BELANGRIJK VOOR DEZE SAMENVATTING:\n' +
    '- Erken expliciet dat dit spannend of onwennig kon voelen\n' +
    '- Normaliseer weerstand — dat is niet falen, dat is bewegen\n' +
    '- Benoem wat er is gebeurd zonder het te beoordelen\n\n' +

    'STRUCTUUR (drie alineas):\n\n' +

    'Alinea 1 — Wat er is gebeurd (max 2 zinnen):\n' +
    'Concreet. Gebruik hun eigen woorden.\n' +
    'Gebruik: "het lijkt", "je hebt", "je raakte"\n\n' +

    'Alinea 2 — Weerstand erkennen (max 2 zinnen):\n' +
    'Benoem dat het onwennig kon voelen als dat relevant is.\n' +
    'Voorbeeld: "Je hebt dit aangeraakt — ook al voelde het misschien onwennig. Dat is precies genoeg."\n\n' +

    'Alinea 3 — Eerste stap (exact 1 zin):\n' +
    'Eén kleine herhaling of variatie. Direct uitvoerbaar.\n' +
    'Nooit: groter maken, pitch, klanten, validatie.\n\n' +

    'TOTALE LENGTE: maximaal 90 woorden\n\n' +

    'FORMATTING: geen markdown, geen headers, geen bullets\n\n' +

    'VERBODEN: "je moet", "je bent iemand die", "business",\n' +
    '"klant", "valideren", "pitch", "LinkedIn", "markt"\n\n' +

    'WEEK 3 ANTWOORDEN:\n' + w3Answers + '\n\n' +
    'EERDERE WEKEN (ter context):\n' + allPrevious;

  try {
    const res = await fetch('/api/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    document.getElementById('w3-summary-text').textContent =
      stripMarkdown(data.content[0].text.trim());
  } catch (err) {
    document.getElementById('w3-summary-text').textContent =
      'Je hebt dit aangeraakt — ook al voelde het misschien onwennig. ' +
      'Dat is precies genoeg.\n\n' +
      'De volgende stap is simpel: doe het nog één keer, ' +
      'of pas één klein ding aan.';
  }

  goTo('s-w3-summary');
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
