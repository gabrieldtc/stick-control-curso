let bpm = 80;
let timeSignature = 4;
let timerInterval = null;
let timerSeconds = 300;
let timerTotalSeconds = 300;
let timerRunning = false;
let practiceTimeAccumulated = 0;
let lastSavedPracticeTime = 0;
let maxBpmAchieved = 0;
let customExerciseContext = null;

// Count-in
let countInBeats = 4;
let isCountInActive = false;

// BPM Controls
function changeBPM(delta) {
  bpm = Math.max(40, Math.min(200, bpm + delta));
  document.getElementById('bpm-value').textContent = bpm;
  audioEngine.setTempo(bpm);
  if (bpm > maxBpmAchieved) maxBpmAchieved = bpm;
  rememberBpm();
}

function setBPM(value) {
  bpm = Math.max(40, Math.min(200, value));
  document.getElementById('bpm-value').textContent = bpm;
  audioEngine.setTempo(bpm);
  if (bpm > maxBpmAchieved) maxBpmAchieved = bpm;
  rememberBpm();
}

// Remember last BPM used per chapter / custom exercise
function rememberBpm() {
  try {
    if (typeof currentChapterId !== 'undefined' && currentChapterId !== null) {
      localStorage.setItem('bpmCh_' + currentChapterId, bpm);
    }
    if (typeof customExerciseContext !== 'undefined' && customExerciseContext && customExerciseContext.exerciseId) {
      localStorage.setItem('bpmEx_' + customExerciseContext.exerciseId, bpm);
    }
  } catch(e) {}
}

function getPracticeTime() { return practiceTimeAccumulated; }
function getMaxBpm() { return Math.max(maxBpmAchieved, bpm); }

function resetPracticeTracking() {
  practiceTimeAccumulated = 0;
  lastSavedPracticeTime = 0;
  maxBpmAchieved = bpm;
}

// Conta o tempo de toque real do metrônomo mesmo sem usar o timer.
// Só incrementa quando o timer NÃO está rodando (o intervalo do timer já acumula sozinho),
// evitando contagem dupla quando o usuário toca com o timer ativo.
setInterval(function() {
  if (isPlaying && !timerRunning) {
    practiceTimeAccumulated++;
  }
}, 1000);

// Auto-save periódico do tempo de prática enquanto toca.
// Garante que os minutos sejam persistidos mesmo se o usuário não clicar em "marcar como completo".
if (typeof savePracticeProgress === 'function') {
  setInterval(function() {
    if (isPlaying && !timerRunning && practiceTimeAccumulated - lastSavedPracticeTime >= 30) {
      savePracticeProgress();
    }
  }, 15000);
}

// Time Signature
function setTimeSig(sig, el) {
  timeSignature = sig;
  audioEngine.setTimeSignature(sig);
  document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');
  updateMetronomeVisual(sig);
  // Count-in follows the time signature (4/4 counts 4, 3/4 counts 3...)
  var ciCheckbox = document.getElementById('countin-toggle');
  if (ciCheckbox) ciCheckbox.value = sig;
  if (typeof renderPartitura === 'function' && typeof getCurrentExercise === 'function') {
    renderPartitura(getCurrentExercise());
  }
}

function updateMetronomeVisual(sig) {
  const container = document.getElementById('metronome-visual');
  if (!container) return;
  let html = '';
  for (let i = 1; i <= sig; i++) {
    html += '<div class="beat-dot ' + (i === 1 ? 'accent-beat' : '') + '" data-beat="' + i + '"></div>';
  }
  container.innerHTML = html;
}

function onBeat(beatIndex, measureBeat) {
  const npb = typeof audioEngine !== 'undefined' ? audioEngine.notesPerBeat : 2;
  // measureBeat comes from the continuous measure grid (never resets on loop),
  // so the dots always cycle 1-2-3, 1-2-3 regardless of exercise length
  const beatNum = (typeof measureBeat === 'number' && measureBeat >= 0)
    ? measureBeat % timeSignature
    : Math.floor(beatIndex / npb) % timeSignature;
  const beatInMeasure = beatNum + 1;
  document.querySelectorAll('.beat-dot').forEach(dot => dot.classList.remove('active'));
  const activeDot = document.querySelector('.beat-dot[data-beat="' + beatInMeasure + '"]');
  if (activeDot) activeDot.classList.add('active');
}

// Count-in callback
audioEngine.onCountCallback = function(beatIndex) {
  const countNum = Math.abs(beatIndex); // 1, 2, 3, 4...
  const countVal = ((countNum - 1) % timeSignature) + 1;
  // Highlight count-in beats on metronome visual
  document.querySelectorAll('.beat-dot').forEach(dot => dot.classList.remove('active'));
  const dot = document.querySelector('.beat-dot[data-beat="' + countVal + '"]');
  if (dot) {
    dot.classList.add('active');
    dot.classList.add('count-in');
    setTimeout(function() { dot.classList.remove('count-in'); }, 200);
  }
  // Big visible count on screen
  showCountNumber(countVal);
};

function showCountNumber(n) {
  let el = document.getElementById('count-in-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'count-in-overlay';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  el.textContent = n;
  el.classList.add('show');
}

function hideCountNumber() {
  const el = document.getElementById('count-in-overlay');
  if (el) el.classList.remove('show');
}

// Audio Controls
let isPlaying = false;

function togglePlay() {
  const partituraData = getCurrentExercise();
  if (!partituraData || partituraData.length === 0) return;

  isPlaying = !isPlaying;
  const playBtn = document.getElementById('play-btn');
  const playIcon = document.getElementById('play-icon');

  if (isPlaying) {
    var opts = {
      tempo: bpm,
      timeSignature: timeSignature,
      loop: audioEngine.isLoop,
      slow: audioEngine.isSlow
    };
    // Count-in check
    var ciCheckbox = document.getElementById('countin-toggle');
    if (ciCheckbox && ciCheckbox.checked) {
      opts.countIn = parseInt(ciCheckbox.value) || 4;
    }
    audioEngine.play(partituraData, opts);
    playIcon.textContent = '⏸';
    playBtn.classList.add('active');
  } else {
    audioEngine.stop();
    playIcon.textContent = '▶';
    playBtn.classList.remove('active');
  }
}

function stopAudio() {
  isPlaying = false;
  audioEngine.stop();
  hideCountNumber();
  var playIcon = document.getElementById('play-icon');
  var playBtn = document.getElementById('play-btn');
  if (playIcon) playIcon.textContent = '▶';
  if (playBtn) playBtn.classList.remove('active');
  document.querySelectorAll('.nota').forEach(n => n.classList.remove('playing'));
}

function toggleSlow() {
  var isSlow = audioEngine.toggleSlow();
  var btn = document.getElementById('slow-btn');
  if (btn) btn.classList.toggle('active', isSlow);
}

function toggleLoop() {
  var isLoop = audioEngine.toggleLoop();
  var btn = document.getElementById('loop-btn');
  if (btn) btn.classList.toggle('active', isLoop);
}

/* ── Volume Controls ── */
function setVolume(type, value) {
  var v = parseFloat(value);
  if (isNaN(v)) return;
  if (type === 'master') audioEngine.setMasterVolume(v);
  else if (type === 'metronome') audioEngine.setMetronomeVolume(v);
  else if (type === 'exercise') audioEngine.setExerciseVolume(v);
}

/* ── Tap Tempo ── */
var tapTimes = [];
var tapTimer = null;

function tapTempo() {
  var now = Date.now();
  tapTimes.push(now);
  if (tapTimes.length > 8) tapTimes.shift();

  // Clear stale taps after 2s
  if (tapTimer) clearTimeout(tapTimer);
  tapTimer = setTimeout(function() { tapTimes = []; }, 2000);

  if (tapTimes.length >= 2) {
    var intervals = [];
    for (var i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i - 1]);
    }
    var avg = intervals.reduce(function(a, b) { return a + b; }, 0) / intervals.length;
    if (avg > 0) {
      var newBpm = Math.round(60000 / avg);
      setBPM(newBpm);
    }
  }
  // Visual feedback
  var btn = document.getElementById('tap-btn');
  if (btn) {
    btn.classList.add('active');
    setTimeout(function() { btn.classList.remove('active'); }, 150);
  }
}

/* ── Timer ── */
function toggleTimer() {
  if (timerRunning) pauseTimer();
  else if (timerSeconds > 0 && timerSeconds < (parseInt(document.getElementById('timer-minutes').value) || 5) * 60) resumeTimer();
  else startTimer();
}

function pauseTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    var btn = document.getElementById('timer-btn');
    btn.textContent = '⏱ Continuar';
    btn.classList.remove('active');
    if (isPlaying) togglePlay();
  }
}

function resumeTimer() {
  if (!timerRunning && timerSeconds > 0) {
    timerRunning = true;
    var btn = document.getElementById('timer-btn');
    btn.textContent = '⏸ Pausar';
    btn.classList.add('active');
    if (!isPlaying) {
      if (!audioEngine.isLoop) toggleLoop();
      togglePlay();
    }
    timerInterval = setInterval(function() {
      timerSeconds--;
      practiceTimeAccumulated++;
      updateTimerDisplay();
      updateTimerProgress();
      if (timerSeconds <= 0) { stopTimer(); showTimerComplete(); }
    }, 1000);
  }
}

function startTimer() {
  var minutes = parseInt(document.getElementById('timer-minutes').value) || 5;
  timerTotalSeconds = minutes * 60;
  timerSeconds = timerTotalSeconds;
  timerRunning = true;
  var btn = document.getElementById('timer-btn');
  btn.textContent = '⏸ Pausar';
  btn.classList.add('active');
  var timerDisplay = document.getElementById('timer-display');
  timerDisplay.classList.add('timer-active');
  updateTimerDisplay();
  if (!isPlaying) {
    if (!audioEngine.isLoop) toggleLoop();
    togglePlay();
  }
  timerInterval = setInterval(function() {
    timerSeconds--;
    practiceTimeAccumulated++;
    updateTimerDisplay();
    updateTimerProgress();
    if (timerSeconds <= 0) { stopTimer(); showTimerComplete(); }
  }, 1000);
}

function stopTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  var btn = document.getElementById('timer-btn');
  btn.textContent = '⏱ Iniciar';
  btn.classList.remove('active');
  var timerDisplay = document.getElementById('timer-display');
  timerDisplay.classList.remove('timer-active');
  if (isPlaying) togglePlay();
}

function updateTimerDisplay() {
  var minutes = Math.floor(timerSeconds / 60);
  var seconds = timerSeconds % 60;
  var display = document.getElementById('timer-display');
  display.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  display.classList.toggle('timer-urgent', timerSeconds <= 10 && timerSeconds > 0);
}

function updateTimerProgress() {
  if (!timerTotalSeconds) return;
  var elapsed = timerTotalSeconds - timerSeconds;
  var percent = (elapsed / timerTotalSeconds) * 100;
  var bar = document.querySelector('.countdown-progress-fill');
  if (bar) bar.style.width = percent + '%';
}

async function showTimerComplete() {
  var timerDisplay = document.getElementById('timer-display');
  timerDisplay.textContent = '🎉 COMPLETO!';
  timerDisplay.classList.add('timer-complete');
  var previousBest = await fetchPreviousBest();
  savePracticeProgress();
  showPracticeSummary(previousBest);
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Do Travesseiro ao Groove', { body: 'Tempo de prática completo! Bom trabalho!', icon: '🥁' });
  }
  setTimeout(function() {
    timerDisplay.classList.remove('timer-complete');
    updateTimerDisplay();
  }, 3000);
}

/* ── Resumo pós-prática ── */
function formatSessionTime(seconds) {
  seconds = Math.max(0, Math.round(seconds || 0));
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  if (m > 0) return m + 'min ' + s + 's';
  return s + 's';
}

async function fetchPreviousBest() {
  var token = localStorage.getItem('token');
  if (!token) return null;
  try {
    if (typeof customExerciseContext !== 'undefined' && customExerciseContext && customExerciseContext.exerciseId) {
      var res = await fetch('/api/user/exercises', { headers: { 'Authorization': 'Bearer ' + token } });
      var list = await res.json();
      var ex = list.find(function(e) { return e.id === customExerciseContext.exerciseId; });
      return ex && ex.progress ? (ex.progress.max_bpm || 0) : 0;
    }
    if (typeof currentChapterId !== 'undefined') {
      var res2 = await fetch('/api/progress', { headers: { 'Authorization': 'Bearer ' + token } });
      var prog = await res2.json();
      var row = prog.find(function(p) { return p.chapter_id === currentChapterId; });
      return row ? (row.max_bpm || 0) : 0;
    }
  } catch(e) {}
  return null;
}

function showPracticeSummary(previousBest) {
  var sessionTime = formatSessionTime(timerTotalSeconds);
  var maxBpm = getMaxBpm();

  var overlay = document.createElement('div');
  overlay.className = 'ach-popup-overlay show';
  overlay.innerHTML = `
    <div class="ach-popup practice-summary-popup">
      <div class="ach-popup-icon">🥁</div>
      <h2>Sessão concluída!</h2>
      <div class="summary-stats">
        <div class="summary-stat">
          <span class="summary-stat-value">${sessionTime}</span>
          <span class="summary-stat-label">Tempo</span>
        </div>
        <div class="summary-stat">
          <span class="summary-stat-value">${maxBpm} BPM</span>
          <span class="summary-stat-label">Velocidade</span>
        </div>
        <div class="summary-stat">
          <span class="summary-stat-value" id="summary-goal-value">…</span>
          <span class="summary-stat-label">Meta semanal</span>
        </div>
        <div class="summary-stat">
          <span class="summary-stat-value" id="summary-daily-value">…</span>
          <span class="summary-stat-label">Meta diária</span>
        </div>
      </div>
      <div class="summary-record" id="summary-record"></div>
      <button onclick="this.closest('.ach-popup-overlay').remove()">Continuar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

  var recordEl = overlay.querySelector('#summary-record');
  if (previousBest === null || previousBest === undefined) {
    recordEl.innerHTML = 'Continue praticando para alcançar novos recordes! 💪';
  } else if (maxBpm > previousBest) {
    recordEl.classList.add('record');
    recordEl.innerHTML = '🏆 NOVO RECORDE! Você ultrapassou ' + previousBest + ' BPM.';
  } else if (maxBpm === previousBest) {
    recordEl.innerHTML = 'Você igualou seu recorde de ' + previousBest + ' BPM. Bora ultrapassar! 🔥';
  } else {
    recordEl.innerHTML = 'Seu recorde neste exercício é ' + previousBest + ' BPM. Continue evoluindo! 🎯';
  }

  loadSummaryWeeklyGoal(overlay);
}

async function loadSummaryWeeklyGoal(overlay) {
  var token = localStorage.getItem('token');
  var el = overlay.querySelector('#summary-goal-value');
  var dailyEl = overlay.querySelector('#summary-daily-value');
  if (!token) return;
  try {
    var goalRes = await fetch('/api/user/weekly-goal', { headers: { 'Authorization': 'Bearer ' + token } });
    var goalData = await goalRes.json();
    var goal = goalData.weeklyGoal || 60;
    var dailyGoal = goalData.dailyGoal || 10;
    var histRes = await fetch('/api/progress/history', { headers: { 'Authorization': 'Bearer ' + token } });
    var hist = await histRes.json();
    var weekMins = calcWeekMinutes(hist);
    if (el) {
      var pct = Math.min(100, Math.round((weekMins / goal) * 100));
      el.textContent = weekMins + ' / ' + goal + 'min';
      el.title = pct + '% da meta semanal atingida';
    }
    if (dailyEl) {
      var todayMins = calcTodayMinutes(hist);
      var dpct = Math.min(100, Math.round((todayMins / dailyGoal) * 100));
      dailyEl.textContent = todayMins + ' / ' + dailyGoal + 'min';
      dailyEl.title = dpct + '% da meta diária atingida';
    }
  } catch(e) {}
}

function calcTodayMinutes(hist) {
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var total = 0;
  (hist || []).forEach(function(row) {
    var parts = String(row.practice_date).split('-');
    if (parts.length !== 3) return;
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (d.getTime() === today.getTime()) total += row.total_seconds || 0;
  });
  return Math.round(total / 60);
}

function calcWeekMinutes(hist) {
  var now = new Date();
  // Week starts on Sunday
  var sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  var saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  var total = 0;
  (hist || []).forEach(function(row) {
    var parts = String(row.practice_date).split('-');
    if (parts.length !== 3) return;
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (d >= sunday && d <= saturday) total += row.total_seconds || 0;
  });
  return Math.round(total / 60);
}

/* ── Imprimir partitura ── */
function printPartitura() {
  var src = document.getElementById('partitura') || document.getElementById('partitura-preview');
  if (!src) return;
  var existing = document.getElementById('print-area');
  if (existing) existing.remove();

  var title = '';
  var titleEl = document.getElementById('chapter-title');
  if (titleEl) title = titleEl.textContent;
  else {
    var nomeEl = document.getElementById('exercicio-nome');
    if (nomeEl && nomeEl.value) title = nomeEl.value;
  }

  var area = document.createElement('div');
  area.id = 'print-area';
  area.innerHTML = (title ? '<h1 class="print-title">' + title + '</h1>' : '') + '<div class="print-partitura">' + src.innerHTML + '</div>';
  document.body.appendChild(area);
  window.print();
}

// Auto-save
async function savePracticeProgress() {
  var token = localStorage.getItem('token');
  if (!token) return;

  var practiceTime = practiceTimeAccumulated - lastSavedPracticeTime;
  var maxBpm = Math.max(maxBpmAchieved, bpm);

  // Custom exercise context
  if (typeof customExerciseContext !== 'undefined' && customExerciseContext && customExerciseContext.exerciseId) {
    if (practiceTime === 0) return;
    try {
      await fetch('/api/user/exercises/' + customExerciseContext.exerciseId + '/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ maxBpm: maxBpm, practiceTime: practiceTime })
      });
      lastSavedPracticeTime = practiceTimeAccumulated;
    } catch(e) {}
    return;
  }

  if (typeof currentChapterId === 'undefined') return;

  if (practiceTime === 0 && maxBpm <= 80) return;

  try {
    var r = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ chapterId: currentChapterId, completed: false, maxBpm: maxBpm, practiceTime: practiceTime })
    });
    if (!r.ok) {
      console.error('POST /api/progress falhou com status', r.status);
      alert('Erro ao salvar prática (status ' + r.status + '). Veja o console da página para mais detalhes.');
    } else {
      lastSavedPracticeTime = practiceTimeAccumulated;
    }
  } catch(e) {
    console.error('Erro de rede ao salvar prática:', e);
    alert('Falha de rede ao salvar prática. Verifique sua conexão e tente novamente.');
  }

  if (typeof checkAchievements === 'function') checkAchievements();
}

// Beat callback
audioEngine.onBeatCallback = function(beatIndex, measureBeat) {
  hideCountNumber(); // count-in finished, exercise has started
  document.querySelectorAll('.nota').forEach(function(n) { n.classList.remove('playing'); });
  var notas = document.querySelectorAll('.nota');
  if (notas[beatIndex]) notas[beatIndex].classList.add('playing');
  onBeat(beatIndex, measureBeat);
};

/* ── Kits de som ── */
function setKit(kit) {
  if (typeof audioEngine !== 'undefined' && audioEngine.setKit) audioEngine.setKit(kit);
  try { localStorage.setItem('kit', kit); } catch(e) {}
  var sel = document.getElementById('kit-select');
  if (sel && sel.value !== kit) sel.value = kit;
}

(function restoreKit() {
  try {
    var saved = localStorage.getItem('kit');
    if (saved && typeof audioEngine !== 'undefined' && audioEngine.setKit) {
      audioEngine.setKit(saved);
      var sel = document.getElementById('kit-select');
      if (sel) sel.value = saved;
    }
  } catch(e) {}
})();

/* ── Modo prática sem distração ── */
function togglePracticeFocus() {
  var on = document.body.classList.toggle('focus-mode');
  document.querySelectorAll('.focus-btn').forEach(function(btn) { btn.classList.toggle('active', on); });
  if (on) {
    var pc = document.querySelector('.practice-column');
    if (pc) pc.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function exitPracticeFocus() {
  document.body.classList.remove('focus-mode');
  document.querySelectorAll('.focus-btn').forEach(function(btn) { btn.classList.remove('active'); });
}

/* ── Atalhos de teclado ── */
document.addEventListener('keydown', function(e) {
  var tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;

  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    changeBPM(5);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    changeBPM(-5);
  } else if (e.key === 'Escape') {
    stopAudio();
    exitPracticeFocus();
  } else if (e.key === 't' || e.key === 'T') {
    tapTempo();
  } else if (e.key === 'l' || e.key === 'L') {
    toggleLoop();
  }
});
