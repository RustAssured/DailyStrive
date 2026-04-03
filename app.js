// ─── State ──────────────────────────────────────────────────────────────────
const DAYS = 7;
let currentScreen = 0;
const answers = {};

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

  document.getElementById('done-title').textContent = 'Dag ' + n + ' opgeslagen.';
  document.getElementById('done-sub').textContent = n < DAYS
    ? 'Morgen is dag ' + (n + 1) + '. Eén nieuwe vraag.'
    : 'Je hebt alle zeven dagen gedaan.';

  renderLog();
  goTo(12);
}

// ─── Render logboek ──────────────────────────────────────────────────────────
function renderLog() {
  const logEl = document.getElementById('log-wrap');
  const all = load('answers') || {};
  const entries = Object.entries(all).filter(([k]) => k.startsWith('dag'));
  if (entries.length === 0) { logEl.innerHTML = ''; return; }
  logEl.innerHTML = entries.map(([k, v]) =>
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
    'Je bent een zacht en eerlijk systeem dat mensen helpt richting te ontdekken.\n\n' +
    'Iemand heeft zeven dagen lang één vraag per dag beantwoord. Dit zijn hun antwoorden:\n\n' +
    context + '\n\n' +
    'Schrijf nu een zachte samenvatting van wat je ziet ontstaan.\n\n' +
    'Harde regels:\n' +
    '- Max 4 zinnen\n' +
    '- Geen "je moet" of "je zou moeten"\n' +
    '- Geen business-taal: geen "product", "klant", "valideren", "business", "ondernemen"\n' +
    '- Gebruik hun eigen woorden terug\n' +
    '- Eindig met één zachte open observatie\n' +
    '- Geen adviezen, geen druk, geen plan\n\n' +
    'Toon: zoals iemand die goed luistert en zachtjes terugspeelt wat hij hoorde.\n\n' +
    'Begin direct met de samenvatting, geen inleiding.';

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
      'Na zeven dagen zie je iets ontstaan. Neem even de tijd om je antwoorden terug te lezen — de richting zit er al in.';
  }

  goTo(9);
}

// ─── Actie Sprint dag 1 ───────────────────────────────────────────────────────
function saveActieDay1() {
  const val = document.getElementById('a13').value.trim();
  answers['actie_dag1'] = val;
  save('answers', answers);
  document.getElementById('done-title').textContent = 'Goed begin.';
  document.getElementById('done-sub').textContent = 'Morgen is er één kleine actie. Meer niet.';
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
