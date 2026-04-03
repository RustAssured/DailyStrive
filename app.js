// ─── State ──────────────────────────────────────────────────────────────────
const DAYS = 7;
let currentScreen = 0;
const answers = {};
let nextDayNumber = 0;

// ─── Navigation ─────────────────────────────────────────────────────────────
function goTo(n) {
  document.getElementById('s' + currentScreen).classList.remove('on');
  currentScreen = n;
  document.getElementById('s' + n).classList.add('on');
  window.scrollTo(0, 0);
  updateProgress(n);
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
  const entries = Object.entries(all).filter(([k]) => k.startsWith('dag'));
  if (entries.length === 0) { logEl.innerHTML = ''; return; }
  logEl.innerHTML = '<div class="log-label" style="margin-bottom: 1rem;">Wat je tot nu toe hebt opgeschreven</div>' + entries.map(([k, v]) =>
    '<div class="log-entry">' +
      '<div class="log-label">' + k.replace('dag', 'Dag ') + '</div>' +
      '<div class="log-text">' + v + '</div>' +
    '</div>'
  ).join('');
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
    'Je schrijft een korte, warme reflectie voor een gebruiker op basis van 7 antwoorden.\n\n' +

    'BELANGRIJK:\n' +
    '- Je bent geen coach\n' +
    '- Je geeft geen advies\n' +
    '- Je trekt geen harde conclusies\n' +
    '- Je labelt de gebruiker niet\n' +
    '- Je gebruikt woorden als: "het lijkt", "misschien", "het voelt alsof"\n' +
    '- Je laat ruimte voor twijfel en interpretatie\n\n' +

    'STRUCTUUR:\n' +
    '1. Open zacht — gebruik: "Dit is wat er in jouw antwoorden lijkt te ontstaan."\n' +
    '2. Spiegel patronen — wat valt op, waar zit energie, waar voorzichtigheid\n' +
    '3. Geef subtiele richting — wat zou dit kunnen betekenen, zonder conclusie\n' +
    '4. Sluit open af — geen actie, geen plan, alleen een gevoel van richting\n' +
    '5. Voeg optioneel één zin toe die suggereert dat dit waardevol kan zijn voor anderen — zonder het woord "business"\n\n' +

    'TOON: warm, rustig, menselijk, niet zweverig, niet coachy\n\n' +

    'LENGTE: maximaal 120 woorden\n\n' +

    'VERBODEN:\n' +
    '- "je bent iemand die..."\n' +
    '- "dit betekent dat..."\n' +
    '- "je moet..."\n' +
    '- "product", "business", "klant", "valideren", "ondernemen"\n\n' +

    'VOORBEELD van de gewenste toon:\n' +
    '"Dit is wat er in jouw antwoorden lijkt te ontstaan.\n\n' +
    'Het voelt alsof je van nature aandacht hebt voor mensen en hun vragen, ' +
    'en dat je makkelijk woorden vindt om dingen uit te leggen.\n\n' +
    'Tegelijk beweeg je hier nog voorzichtig in, ' +
    'alsof je nog aan het verkennen bent wat klopt.\n\n' +
    'Misschien zit daar iets wat voor anderen waardevol kan zijn — ' +
    'niet als plan, maar als richting.\n\n' +
    'Je hoeft het nog niet scherp te hebben. Dit is al beweging."\n\n' +

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
    document.getElementById('summary-text').textContent = data.content[0].text.trim();
  } catch (err) {
    document.getElementById('summary-text').textContent =
      'Er lijkt iets te ontstaan in wat je hebt opgeschreven. ' +
      'Neem even de tijd om je antwoorden terug te lezen — ' +
      'de richting zit er al in. Je hoeft het nog niet scherp te hebben.';
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
