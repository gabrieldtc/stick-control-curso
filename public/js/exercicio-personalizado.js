let currentExerciseId = null;
let exerciseSequence = ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'];
let selectedNoteType = 'R';

function initEditor() {
  renderNotePalette();
  renderEditorGrid();
  renderPreview();
  loadMyExercises();
  updateCustomContext();
  document.getElementById('exercicio-nome').addEventListener('input', updateSaveBtnState);
  document.getElementById('time-sig-select').addEventListener('change', renderPreview);
  document.getElementById('npb-select').addEventListener('change', renderPreview);

  window.addEventListener('beforeunload', saveCustomProgressBeforeUnload);
}

function renderNotePalette() {
  const palette = document.getElementById('note-palette');
  if (!palette) return;
  palette.innerHTML = '';
  const notes = [
    { value: 'R', label: 'R', cls: 'right-hand accented', desc: 'Direita forte' },
    { value: 'r', label: 'r', cls: 'right-hand soft', desc: 'Direita suave' },
    { value: 'L', label: 'L', cls: 'left-hand accented', desc: 'Esquerda forte' },
    { value: 'l', label: 'l', cls: 'left-hand soft', desc: 'Esquerda suave' },
    { value: '.', label: '·', cls: 'rest', desc: 'Pausa' }
  ];
  notes.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'palette-btn' + (n.value === selectedNoteType ? ' active' : '');
    btn.dataset.value = n.value;
    btn.innerHTML = `<span class="${n.cls}">${n.label}</span><small>${n.desc}</small>`;
    btn.addEventListener('click', () => {
      selectedNoteType = n.value;
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    palette.appendChild(btn);
  });
}

function renderEditorGrid() {
  const grid = document.getElementById('editor-grid');
  grid.innerHTML = '';
  exerciseSequence.forEach((note, i) => {
    const cell = document.createElement('div');
    cell.className = 'editor-cell';
    cell.textContent = note === '.' ? '·' : note;
    cell.dataset.index = i;
    if (note === '.') cell.classList.add('rest');
    if (note === 'R' || note === 'r') cell.classList.add('right-hand');
    if (note === 'L' || note === 'l') cell.classList.add('left-hand');
    if (note === note.toUpperCase() && note !== '.') cell.classList.add('accented');
    cell.addEventListener('click', (e) => showNotePicker(e, i));
    grid.appendChild(cell);
  });
  const countEl = document.getElementById('note-count');
  if (countEl) countEl.textContent = exerciseSequence.length + ' notas';
}

function showNotePicker(event, index) {
  const existing = document.getElementById('note-picker');
  if (existing) existing.remove();

  const grid = document.getElementById('editor-grid');
  const cell = grid.children[index];
  const rect = cell.getBoundingClientRect();

  const picker = document.createElement('div');
  picker.id = 'note-picker';
  picker.style.cssText = `position:fixed;top:${rect.bottom + 4}px;left:${rect.left}px;z-index:9999;background:var(--bg-secondary);border:1px solid var(--accent);border-radius:10px;padding:6px;display:flex;gap:4px;box-shadow:0 8px 32px rgba(0,0,0,.5);`;

  const notes = [
    { value: 'R', label: 'R', cls: 'right-hand accented' },
    { value: 'r', label: 'r', cls: 'right-hand soft' },
    { value: 'L', label: 'L', cls: 'left-hand accented' },
    { value: 'l', label: 'l', cls: 'left-hand soft' },
    { value: '.', label: '·', cls: 'rest' }
  ];

  notes.forEach(n => {
    const opt = document.createElement('button');
    opt.className = `picker-opt ${n.cls}` + (n.value === exerciseSequence[index] ? ' current' : '');
    opt.textContent = n.label;
    opt.addEventListener('click', () => {
      exerciseSequence[index] = n.value;
      renderEditorGrid();
      renderPreview();
      picker.remove();
    });
    picker.appendChild(opt);
  });

  document.body.appendChild(picker);

  const closePicker = (e) => {
    if (!picker.contains(e.target) && !cell.contains(e.target)) {
      picker.remove();
      document.removeEventListener('click', closePicker);
    }
  };
  setTimeout(() => document.addEventListener('click', closePicker), 10);
}

function addNote() {
  exerciseSequence.push(selectedNoteType);
  renderEditorGrid();
  renderPreview();
}

function addNoteAtStart() {
  exerciseSequence.unshift(selectedNoteType);
  renderEditorGrid();
  renderPreview();
}

function removeNote() {
  if (exerciseSequence.length <= 1) return;
  exerciseSequence.pop();
  renderEditorGrid();
  renderPreview();
}

function clearAllNotes() {
  if (exerciseSequence.length === 0) return;
  exerciseSequence = [];
  renderEditorGrid();
  renderPreview();
}

function setSequence(newSeq) {
  exerciseSequence = [...newSeq];
  renderEditorGrid();
  renderPreview();
}

function renderPreview() {
  const container = document.getElementById('partitura-preview');
  if (!container) return;
  const ts = parseInt(document.getElementById('time-sig-select')?.value || '4');
  const npb = parseInt(document.getElementById('npb-select')?.value || '2');
  const notesPerMeasure = ts * npb;
  if (exerciseSequence.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);padding:16px;">Adicione notas para ver a prévia</p>';
    return;
  }
  let html = '<div class="partitura-mini">';
  for (let m = 0; m < exerciseSequence.length; m += notesPerMeasure) {
    if (m > 0) html += '<span class="barline"></span>';
    html += '<span class="measure"><span class="notes-row">';
    for (let n = 0; n < notesPerMeasure && m + n < exerciseSequence.length; n++) {
      const note = exerciseSequence[m + n];
      let cls = 'nota';
      if (note === 'R' || note === 'r') cls += ' right';
      else if (note === 'L' || note === 'l') cls += ' left';
      else if (note === '.') cls += ' rest';
      if (note === note.toLowerCase() && note !== '.') cls += ' soft';
      html += `<span class="${cls}">${note === '.' ? '&nbsp;' : note}</span>`;
    }
    html += '</span>';
    html += '<span class="beats-row">';
    for (let b = 0; b < ts; b++) {
      html += `<span class="beat-dot" style="grid-column: span ${npb};"></span>`;
    }
    html += '</span></span>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function updateSaveBtnState() {
  const nome = document.getElementById('exercicio-nome').value.trim();
  document.getElementById('save-btn').disabled = !nome || exerciseSequence.length === 0;
}

async function saveExercise() {
  const token = localStorage.getItem('token');
  if (!token) return;
  const nome = document.getElementById('exercicio-nome').value.trim();
  if (!nome || exerciseSequence.length === 0) return;
  const bpmAlvo = parseInt(document.getElementById('bpm-alvo').value) || 60;
  const npb = parseInt(document.getElementById('npb-select').value) || 2;
  const ts = parseInt(document.getElementById('time-sig-select').value) || 4;
  try {
    if (currentExerciseId) {
      await fetch(`/api/user/exercises/${currentExerciseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome, sequencia: exerciseSequence, bpm_alvo: bpmAlvo, notes_per_beat: npb, time_signature: ts })
      });
    } else {
      const res = await fetch('/api/user/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome, sequencia: exerciseSequence, bpm_alvo: bpmAlvo, notes_per_beat: npb, time_signature: ts })
      });
      const data = await res.json();
      if (data.id) currentExerciseId = data.id;
    }
    updateCustomContext();
    loadMyExercises();
    showToast('Exercício salvo!');
  } catch (e) {
    showToast('Erro ao salvar exercício');
  }
}

async function loadMyExercises() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/user/exercises', { headers: { 'Authorization': `Bearer ${token}` } });
    const exercises = await res.json();
    const list = document.getElementById('my-exercises-list');
    if (!list) return;
    if (exercises.length === 0) {
      list.innerHTML = '<p style="color:var(--text-secondary);padding:16px;">Nenhum exercício personalizado ainda</p>';
      return;
    }
    list.innerHTML = exercises.map(ex => {
      const seq = Array.isArray(ex.sequencia) ? ex.sequencia.join(' ') : '';
      return `<div class="exercise-item" data-id="${ex.id}">
        <div class="exercise-item-info" onclick="clickExercise(${ex.id})" style="cursor:pointer;">
          <strong>${ex.nome}</strong>
          <span class="exercise-item-seq">${seq}</span>
          <span class="exercise-item-stats">🎯 ${ex.progress?.max_bpm || 0} BPM | ⏱ ${formatTime(ex.progress?.practice_time || 0)} | ${ex.progress?.completed ? '✅ Completo' : '⏳ Em andamento'}</span>
        </div>
        <div class="exercise-item-actions">
          <button class="btn-control" onclick="event.stopPropagation();editExercise(${ex.id})">✏️</button>
          <button class="btn-control" onclick="event.stopPropagation();playExercise(${ex.id})">▶️</button>
          <button class="btn-control" onclick="event.stopPropagation();deleteExercise(${ex.id})">🗑️</button>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    console.error('Erro ao carregar exercícios:', e);
  }
}

async function editExercise(id) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/user/exercises', { headers: { 'Authorization': `Bearer ${token}` } });
    const exercises = await res.json();
    const ex = exercises.find(e => e.id === id);
    if (!ex) return;
    currentExerciseId = ex.id;
    document.getElementById('exercicio-nome').value = ex.nome;
    document.getElementById('bpm-alvo').value = ex.bpm_alvo || 60;
    document.getElementById('npb-select').value = ex.notes_per_beat || 2;
    document.getElementById('time-sig-select').value = ex.time_signature || 4;
    exerciseSequence = Array.isArray(ex.sequencia) ? [...ex.sequencia] : [];
    renderEditorGrid();
    renderPreview();
    updateSaveBtnState();
    updateCustomContext();
    applySavedBpmFor(ex.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    showToast('Erro ao carregar exercício');
  }
}

async function playExercise(id) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/user/exercises', { headers: { 'Authorization': `Bearer ${token}` } });
    const exercises = await res.json();
    const ex = exercises.find(e => e.id === id);
    if (!ex || !Array.isArray(ex.sequencia) || ex.sequencia.length === 0) return;
    if (window.audioEngine) {
      window.audioEngine.exercise = ex.sequencia;
    }
    setSequence(ex.sequencia);
    document.getElementById('exercicio-nome').value = ex.nome;
    currentExerciseId = ex.id;
    document.getElementById('bpm-alvo').value = ex.bpm_alvo || 60;
    document.getElementById('npb-select').value = ex.notes_per_beat || 2;
    document.getElementById('time-sig-select').value = ex.time_signature || 4;
    updateSaveBtnState();
    updateCustomContext();
    applySavedBpmFor(ex.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof togglePlay === 'function') {
      setTimeout(togglePlay, 300);
    }
  } catch (e) {
    showToast('Erro ao reproduzir exercício');
  }
}

async function clickExercise(id) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/user/exercises', { headers: { 'Authorization': `Bearer ${token}` } });
    const exercises = await res.json();
    const ex = exercises.find(e => e.id === id);
    if (!ex) return;
    currentExerciseId = ex.id;
    document.getElementById('exercicio-nome').value = ex.nome;
    document.getElementById('bpm-alvo').value = ex.bpm_alvo || 60;
    document.getElementById('npb-select').value = ex.notes_per_beat || 2;
    document.getElementById('time-sig-select').value = ex.time_signature || 4;
    exerciseSequence = Array.isArray(ex.sequencia) ? [...ex.sequencia] : [];
    renderEditorGrid();
    renderPreview();
    updateSaveBtnState();
    updateCustomContext();
    applySavedBpmFor(ex.id);
    document.querySelector('.practice-column')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    showToast('Erro ao carregar exercício');
  }
}

async function deleteExercise(id) {
  if (!confirm('Excluir este exercício?')) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch(`/api/user/exercises/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (currentExerciseId === id) {
      currentExerciseId = null;
      document.getElementById('exercicio-nome').value = '';
      exerciseSequence = ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'];
      renderEditorGrid();
      renderPreview();
      updateSaveBtnState();
      updateCustomContext();
    }
    loadMyExercises();
    showToast('Exercício excluído');
  } catch (e) {
    showToast('Erro ao excluir');
  }
}

function newExercise() {
  currentExerciseId = null;
  document.getElementById('exercicio-nome').value = '';
  document.getElementById('bpm-alvo').value = 60;
  exerciseSequence = ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'];
  renderNotePalette();
  renderEditorGrid();
  renderPreview();
  updateSaveBtnState();
  updateCustomContext();
}

function formatTime(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--accent);color:var(--bg-primary);padding:12px 24px;border-radius:8px;font-weight:600;z-index:9999;transition:opacity .3s;opacity:0;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._hide);
  toast._hide = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

function applySavedBpmFor(exerciseId) {
  var saved = parseInt(localStorage.getItem('bpmEx_' + exerciseId), 10);
  if (saved >= 40 && typeof setBPM === 'function') setBPM(saved);
}

function updateCustomContext() {
  if (typeof customExerciseContext !== 'undefined') {
    customExerciseContext = currentExerciseId ? { exerciseId: currentExerciseId } : null;
  }
  resetPracticeTracking();
}

function saveCustomProgressBeforeUnload() {
  var delta = 0;
  if (typeof practiceTimeAccumulated !== 'undefined' && typeof lastSavedPracticeTime !== 'undefined') {
    delta = practiceTimeAccumulated - lastSavedPracticeTime;
  }
  if (delta > 0 && currentExerciseId) {
    var token = localStorage.getItem('token');
    if (token) {
      var maxBpm = typeof getMaxBpm === 'function' ? getMaxBpm() : bpm;
      fetch('/api/user/exercises/' + currentExerciseId + '/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ maxBpm: maxBpm, practiceTime: delta }),
        keepalive: true
      }).catch(function(){});
    }
  }
}
