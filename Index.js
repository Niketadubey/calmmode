document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('panel-' + t.dataset.tab).classList.add('active');
  });
});

/* ════════════════════════════════════
   SESSION TIMER
════════════════════════════════════ */
let timerInterval = null;
let timerRunning = false;
let timerSeconds = 0;
let timerTargetMins = 0; // 0 = stopwatch
let timerTodaySecs = parseInt(localStorage.getItem('still_today_secs') || '0');
let timerSessionCount = parseInt(localStorage.getItem('still_sessions') || '0');
let timerLastDate = localStorage.getItem('still_last_date') || '';

// Reset daily stats if new day
const todayStr = new Date().toDateString();
if (timerLastDate !== todayStr) {
  timerTodaySecs = 0;
  timerSessionCount = 0;
  localStorage.setItem('still_today_secs', '0');
  localStorage.setItem('still_sessions', '0');
  localStorage.setItem('still_last_date', todayStr);
}

function updateTimerStats() {
  document.getElementById('statSessions').textContent = timerSessionCount;
  const mins = Math.floor(timerTodaySecs / 60);
  document.getElementById('statTotal').textContent = mins + 'm';
}
updateTimerStats();

function setTimerPreset(btn, mins) {
  document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  timerTargetMins = mins;
  resetTimer();
  const modeEl = document.getElementById('timerMode');
  const wrap = document.getElementById('timerProgressWrap');
  if (mins === 0) {
    modeEl.textContent = 'Stopwatch';
    wrap.style.display = 'none';
  } else {
    modeEl.textContent = mins + ' min session';
    wrap.style.display = 'block';
    document.getElementById('timerProgressFill').style.width = '0%';
    document.getElementById('timerProgressFill').style.background = 'linear-gradient(to right, var(--accent2), var(--accent))';
  }
}

function toggleTimer() {
  if (timerRunning) pauseTimer(); else startTimer();
}

function startTimer() {
  timerRunning = true;
  document.getElementById('timerStartBtn').textContent = '⏸';
  timerInterval = setInterval(() => {
    timerSeconds++;
    timerTodaySecs++;
    localStorage.setItem('still_today_secs', timerTodaySecs);
    renderTimerDisplay();
    if (timerTargetMins > 0) updateProgress();
    if (timerTargetMins > 0 && timerSeconds >= timerTargetMins * 60) {
      sessionComplete();
    }
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  document.getElementById('timerStartBtn').textContent = '▶';
}

function resetTimer() {
  pauseTimer();
  timerSeconds = 0;
  document.getElementById('timerDisplay').textContent = '00:00';
  document.getElementById('timerDisplay').className = 'timer-display';
  document.getElementById('timerStartBtn').textContent = '▶';
  if (timerTargetMins > 0) {
    document.getElementById('timerProgressFill').style.width = '0%';
  }
}

function renderTimerDisplay() {
  const remaining = timerTargetMins > 0
    ? Math.max(0, timerTargetMins * 60 - timerSeconds)
    : timerSeconds;
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  const el = document.getElementById('timerDisplay');
  el.textContent = m + ':' + s;
  if (timerTargetMins > 0) {
    const pct = timerSeconds / (timerTargetMins * 60);
    el.className = 'timer-display' + (pct > 0.85 ? ' warning' : '');
  }
}

function updateProgress() {
  const pct = Math.min(100, (timerSeconds / (timerTargetMins * 60)) * 100);
  const fill = document.getElementById('timerProgressFill');
  fill.style.width = pct + '%';
  if (pct > 85) fill.style.background = 'linear-gradient(to right, var(--gold), #e8c090)';
}

function sessionComplete() {
  pauseTimer();
  timerSessionCount++;
  localStorage.setItem('still_sessions', timerSessionCount);
  localStorage.setItem('still_last_date', todayStr);
  updateTimerStats();
  const el = document.getElementById('timerDisplay');
  el.textContent = 'Done ✓';
  el.className = 'timer-display done';
  document.getElementById('timerProgressFill').style.width = '100%';
  // gentle flash
  let flashes = 0;
  const flash = setInterval(() => {
    el.style.opacity = el.style.opacity === '0.3' ? '1' : '0.3';
    if (++flashes > 5) { clearInterval(flash); el.style.opacity = '1'; }
  }, 300);
}

let breathRunning = false;
let breathTimer = null;
let breathCycle = 0;
let currentTech = { name:'4-7-8', tip:'4s inhale · 7s hold · 8s exhale', phases:[4,7,8] };
const phaseNames = ['Inhale','Hold','Exhale','Hold'];
const phaseColors = ['#7ec8c8','#c8a97e','#7e9ec8','#c8a97e'];

function setTech(btn, name, tip, phases) {
  document.querySelectorAll('.technique-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTech = { name, tip, phases };
  document.getElementById('breathTip').textContent = tip;
  if (breathRunning) { stopBreath(); }
}

function toggleBreath() {
  if (breathRunning) stopBreath(); else startBreath();
  addRipple();
}

function startBreath() {
  breathRunning = true;
  breathCycle = 0;
  document.getElementById('breathRing').classList.add('running');
  runPhase(0);
}

function stopBreath() {
  breathRunning = false;
  clearTimeout(breathTimer);
  const ring = document.getElementById('breathRing');
  ring.className = 'breath-ring-wrap';
  document.getElementById('breathLabel').textContent = 'Tap to begin';
  document.getElementById('breathCount').textContent = '— · —';
}

function runPhase(idx) {
  if (!breathRunning) return;
  const phases = currentTech.phases;
  const duration = phases[idx] * 1000;
  const label = document.getElementById('breathLabel');
  const count = document.getElementById('breathCount');
  const ring = document.getElementById('breathRing');

  label.style.opacity = 0;
  setTimeout(() => {
    label.textContent = phaseNames[idx] || phaseNames[idx % phaseNames.length];
    label.style.color = phaseColors[idx] || phaseColors[idx % phaseColors.length];
    label.style.opacity = 1;
  }, 200);
  count.textContent = `${phases[idx]}s · cycle ${breathCycle + 1}`;

  // drive ring animation
  ring.className = 'breath-ring-wrap running';
  if (idx === 0) ring.classList.add('expand');
  else if (idx === 1 || (idx === 3)) ring.classList.add('hold');
  else ring.classList.add('contract');

  breathTimer = setTimeout(() => {
    const nextIdx = (idx + 1) % phases.length;
    if (nextIdx === 0) breathCycle++;
    runPhase(nextIdx);
  }, duration);
}

function addRipple() {
  const wrap = document.getElementById('breathRing');
  const r = document.createElement('div');
  r.className = 'ripple';
  wrap.appendChild(r);
  setTimeout(() => r.remove(), 1500);
}

/* ════════════════════════════════════
   SOUNDS (Web Audio API)
════════════════════════════════════ */
const sounds = [
  { icon:'🌊', name:'Ocean', fn: genOcean },
  { icon:'🌧', name:'Rain', fn: genRain },
  { icon:'🌲', name:'Forest', fn: genForest },
  { icon:'🔥', name:'Fireplace', fn: genFire },
  { icon:'🎶', name:'Singing Bowl', fn: genBowl },
  { icon:'🌬', name:'Wind', fn: genWind },
  { icon:'☔', name:'Thunder', fn: genThunder },
  { icon:'🌌', name:'Space', fn: genSpace },
];

let audioCtx = null;
let activeNodes = [];
let masterGain = null;
let activeSoundId = null;

function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function buildSounds() {
  const grid = document.getElementById('soundsGrid');
  sounds.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'sound-card'; card.id = 'sound-' + i;
    card.innerHTML = `<span class="sound-icon">${s.icon}</span><div class="sound-name">${s.name}</div>
    <div class="sound-bars">${'<div class="bar"></div>'.repeat(5)}</div>`;
    card.onclick = () => toggleSound(i, s.fn);
    grid.appendChild(card);
  });
}
buildSounds();

function toggleSound(id, fn) {
  ensureCtx();
  if (activeSoundId === id) {
    stopAllSounds(); return;
  }
  stopAllSounds();
  activeSoundId = id;
  document.getElementById('sound-' + id).classList.add('playing');
  activeNodes = fn();
}

function stopAllSounds() {
  activeSoundId = null;
  document.querySelectorAll('.sound-card').forEach(c => c.classList.remove('playing'));
  activeNodes.forEach(n => { try { n.stop && n.stop(0); n.disconnect && n.disconnect(); } catch(e){} });
  activeNodes = [];
}

function setVolume(v) {
  if (masterGain) masterGain.gain.value = parseFloat(v);
  const slider = document.getElementById('volumeSlider');
  slider.style.setProperty('--val', (v * 100) + '%');
}

// ── noise helpers ──
function createNoise(ctx, duration = 10) {
  const sampleRate = ctx.sampleRate;
  const buf = ctx.createBuffer(2, sampleRate * duration, sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function loopedNoise(ctx, gain, filter, type = 'bandpass') {
  const buf = createNoise(ctx);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const g = ctx.createGain(); g.gain.value = gain;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = filter[0]; f.Q.value = filter[1] || 1;
  src.connect(f); f.connect(g); g.connect(masterGain);
  src.start();
  return [src, g, f];
}

function genOcean() {
  const n1 = loopedNoise(audioCtx, 0.5, [400, 0.8], 'lowpass');
  const n2 = loopedNoise(audioCtx, 0.3, [200, 0.5], 'lowpass');
  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain(); lfoG.gain.value = 0.3;
  lfo.frequency.value = 0.12;
  lfo.connect(lfoG); lfoG.connect(n1[1].gain);
  lfo.start();
  return [...n1, ...n2, lfo, lfoG];
}

function genRain() {
  const n = loopedNoise(audioCtx, 0.4, [3000, 1], 'bandpass');
  const n2 = loopedNoise(audioCtx, 0.2, [6000, 1.5], 'highpass');
  return [...n, ...n2];
}

function genForest() {
  const n = loopedNoise(audioCtx, 0.2, [800, 2], 'bandpass');
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.05;
  const lfoG = audioCtx.createGain(); lfoG.gain.value = 0.1;
  lfo.connect(lfoG); lfoG.connect(n[1].gain);
  lfo.start();
  const chirp = () => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.frequency.value = 2400 + Math.random() * 800;
    osc.type = 'sine';
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
  };
  const id = setInterval(chirp, 800 + Math.random() * 2000);
  return [...n, lfo, lfoG, { stop: () => clearInterval(id), disconnect: ()=>{} }];
}

function genFire() {
  const n = loopedNoise(audioCtx, 0.25, [200, 0.3], 'lowpass');
  const n2 = loopedNoise(audioCtx, 0.15, [600, 1], 'bandpass');
  return [...n, ...n2];
}

function genBowl() {
  const baseFreq = 432;
  let nodes = [];
  const ring = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.frequency.value = freq; osc.type = 'sine';
    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  };
  const schedule = () => {
    ring(baseFreq, 6);
    ring(baseFreq * 2, 4);
    ring(baseFreq * 3, 3);
    nodes.timeout = setTimeout(schedule, 7000);
  };
  schedule();
  return [{ stop: () => clearTimeout(nodes.timeout), disconnect: ()=>{} }];
}

function genWind() {
  const n = loopedNoise(audioCtx, 0.35, [1200, 0.6], 'bandpass');
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.07;
  const lfoG = audioCtx.createGain(); lfoG.gain.value = 0.2;
  lfo.connect(lfoG); lfoG.connect(n[1].gain);
  lfo.start();
  return [...n, lfo, lfoG];
}

function genThunder() {
  const rain = loopedNoise(audioCtx, 0.3, [4000, 1], 'bandpass');
  const boom = () => {
    const dur = 2 + Math.random() * 3;
    const n = audioCtx.createBufferSource();
    const buf = createNoise(audioCtx, dur);
    n.buffer = buf;
    const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 150;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    n.connect(f); f.connect(g); g.connect(masterGain); n.start();
  };
  let id = setInterval(boom, 4000 + Math.random() * 6000);
  return [...rain, { stop: () => clearInterval(id), disconnect: ()=>{} }];
}

function genSpace() {
  const drones = [80, 120, 160].map(freq => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain(); g.gain.value = 0.05;
    osc.frequency.value = freq; osc.type = 'sine';
    osc.connect(g); g.connect(masterGain); osc.start();
    return [osc, g];
  }).flat();
  const n = loopedNoise(audioCtx, 0.04, [200, 0.2], 'lowpass');
  return [...drones, ...n];
}

document.getElementById('volumeSlider').oninput = function() { setVolume(this.value); };

/* ════════════════════════════════════
   JOURNAL
════════════════════════════════════ */
const prompts = [
  "What is one thing making you feel heavy right now?",
  "What are three small things you're grateful for today?",
  "Describe a moment today where you felt at peace.",
  "What would you say to yourself if you were your own best friend?",
  "What does rest mean to you?",
  "What are you holding onto that you could let go of?",
  "When do you feel most like yourself?",
  "What tiny thing brought you joy today?",
  "What would make tomorrow feel a little easier?",
  "Write about a memory that brings you warmth.",
];
let promptIdx = Math.floor(Math.random() * prompts.length);
let selectedMood = null;
let entries = JSON.parse(localStorage.getItem('still_entries') || '[]');

function refreshPrompt() {
  promptIdx = (promptIdx + 1) % prompts.length;
  document.getElementById('promptText').textContent = prompts[promptIdx];
}
document.getElementById('promptText').textContent = prompts[promptIdx];

function selectMood(btn, emoji, name) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedMood = { emoji, name };
}

function saveEntry() {
  const text = document.getElementById('journalText').value.trim();
  if (!text) return;
  const entry = {
    mood: selectedMood || { emoji:'📝', name:'Noted' },
    text,
    date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
  };
  entries.unshift(entry);
  localStorage.setItem('still_entries', JSON.stringify(entries.slice(0,50)));
  document.getElementById('journalText').value = '';
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  selectedMood = null;
  renderEntries();
}

function renderEntries() {
  const list = document.getElementById('entryList');
  if (!entries.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:13px;letter-spacing:1px">No reflections yet…</p>'; return; }
  list.innerHTML = entries.slice(0,8).map(e => `
    <div class="entry-item">
      <div class="entry-meta">
        <span class="entry-mood">${e.mood.emoji}</span>
        <span class="entry-date">${e.date} · ${e.mood.name}</span>
      </div>
      <div class="entry-text">${e.text.substring(0,180)}${e.text.length > 180 ? '…' : ''}</div>
    </div>`).join('');
}
renderEntries();

/* ════════════════════════════════════
   AFFIRMATIONS
════════════════════════════════════ */
const affirmations = [
  { cat:'peace',    text:'I release what I cannot control and trust in the flow of life.' },
  { cat:'self',     text:'I am worthy of rest, love, and all good things.' },
  { cat:'strength', text:'I have survived every difficult day so far — <em>I am resilient.</em>' },
  { cat:'present',  text:'Right now, this breath, this moment — <em>this is enough.</em>' },
  { cat:'peace',    text:'My mind is calm. My heart is open. I am at peace.' },
  { cat:'self',     text:'I treat myself with the same kindness I give to those I love.' },
  { cat:'strength', text:'Challenges reveal my strength. I grow through every storm.' },
  { cat:'present',  text:'I am not my thoughts. I am the awareness behind them.' },
  { cat:'peace',    text:'I choose peace over worry, presence over perfection.' },
  { cat:'self',     text:'I am enough — <em>exactly as I am, right now.</em>' },
  { cat:'strength', text:'My courage is greater than any fear I face.' },
  { cat:'present',  text:'The present moment is where my life truly lives.' },
  { cat:'peace',    text:'I breathe in calm, and exhale all that no longer serves me.' },
  { cat:'self',     text:'My feelings are valid. My needs matter. I deserve care.' },
  { cat:'strength', text:'I anchor myself in stillness amidst life\'s storms.' },
  { cat:'present',  text:'I release the past and am fully present in this moment.' },
];

let currentCat = 'all';
let affirmIdx = 0;

function filterCat(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCat = btn.dataset.cat;
  affirmIdx = 0;
  showAffirmation();
}

function getFiltered() {
  return currentCat === 'all' ? affirmations : affirmations.filter(a => a.cat === currentCat);
}

function showAffirmation() {
  const list = getFiltered();
  const a = list[affirmIdx % list.length];
  const el = document.getElementById('affirmText');
  el.style.opacity = 0;
  setTimeout(() => { el.innerHTML = a.text; el.style.opacity = 1; }, 200);
}

function nextAffirmation() {
  affirmIdx++;
  showAffirmation();
}
showAffirmation();
