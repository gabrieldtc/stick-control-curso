const express = require('express');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// ============ SAFETY NET ============
process.on('uncaughtException', (err) => {
  console.error('⚠️ Erro não capturado (mantendo servidor):', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Promise rejeitada sem handler (mantendo servidor):', reason instanceof Error ? reason.message : reason);
});

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'stick-control-secret-2024';
const DB_PATH = path.join('/tmp', 'travesseiro-groove.db');
//const DB_PATH = process.env.DB_PATH ? path.join(process.env.DB_PATH, 'travesseiro-groove.db') : path.join(__dirname, 'database', 'travesseiro-groove.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Debug route
//app.get('/debug', (req, res) => {  res.json({     dirname: __dirname,    cwd: process.cwd(),    files: require('fs').readdirSync(process.cwd())  });});

app.use(express.static(path.join(__dirname, 'public')));

let db;

// ============ DATABASE SETUP ============
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id INTEGER NOT NULL,
      completed BOOLEAN DEFAULT 0,
      max_bpm INTEGER DEFAULT 60,
      practice_time INTEGER DEFAULT 0,
      test_completed BOOLEAN DEFAULT 0,
      last_practiced DATETIME
    )
  `);
  
  // Add test_completed column if missing
  try {
    db.run('ALTER TABLE progress ADD COLUMN test_completed BOOLEAN DEFAULT 0');
  } catch (e) {}
  
  // Add secret question columns if missing
  try {
    db.run('ALTER TABLE users ADD COLUMN secret_question TEXT');
    db.run('ALTER TABLE users ADD COLUMN secret_answer TEXT');
  } catch (e) {}
  
  // Add weekly goal column if missing
  try {
    db.run('ALTER TABLE users ADD COLUMN weekly_goal INTEGER DEFAULT 60');
  } catch (e) {}
  
  // Add daily goal column if missing
  try {
    db.run('ALTER TABLE users ADD COLUMN daily_goal INTEGER DEFAULT 10');
  } catch (e) {}
  
  // Ensure unique constraint on user_id + chapter_id
  try {
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_user_chapter ON progress(user_id, chapter_id)');
  } catch (e) {}
  
  db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_name TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela de exercícios personalizados
  db.run(`
    CREATE TABLE IF NOT EXISTS user_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      sequencia TEXT NOT NULL,
      bpm_alvo INTEGER DEFAULT 60,
      bpm_range_min INTEGER DEFAULT 40,
      bpm_range_max INTEGER DEFAULT 200,
      notes_per_beat INTEGER DEFAULT 2,
      time_signature INTEGER DEFAULT 4,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user_exercise_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      max_bpm INTEGER DEFAULT 0,
      practice_time INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      last_practiced TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  console.log('📦 Banco de dados inicializado');
}

let saveTimeout = null;
function saveDatabase() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const data = db.export();
    const buffer = Buffer.from(data);
    const tmpPath = DB_PATH + '.tmp';
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, DB_PATH);
  }, 500);
}

function saveDatabaseImmediate() {
  if (saveTimeout) clearTimeout(saveTimeout);
  const data = db.export();
  const buffer = Buffer.from(data);
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, buffer);
  fs.renameSync(tmpPath, DB_PATH);
}

// ============ BACKUP AUTOMÁTICO ============
const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups');
const BACKUP_RETENTION = 30; // manter últimas 30 cópias (~15 dias)

function backupDatabase() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    saveDatabaseImmediate();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `travesseiro-groove-${timestamp}.db`);
    fs.copyFileSync(DB_PATH, backupPath);

    // Limpar backups antigos
    let backups = [];
    try { backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('travesseiro-groove-') && f.endsWith('.db')); } catch(e) {}
    if (backups.length > BACKUP_RETENTION) {
      backups.sort().slice(0, backups.length - BACKUP_RETENTION).forEach(f => {
        try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch(e) {}
      });
    }
  } catch(e) {
    console.error('⚠️ Erro no backup:', e.message);
  }
}

// Backup inicial após 5 minutos, depois às 08:00 e 20:00
setTimeout(() => { try { backupDatabase(); scheduleBackup(); } catch(e) {} }, 300000);

function scheduleBackup() {
  const now = new Date();
  const hours = [8, 20];
  let next = null;
  for (const h of hours) {
    const target = new Date(now);
    target.setHours(h, 0, 0, 0);
    if (target > now) { next = target; break; }
  }
  if (!next) {
    next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(hours[0], 0, 0, 0);
  }
  const ms = next - now;
  setTimeout(() => {
    try { backupDatabase(); scheduleBackup(); } catch(e) {}
  }, ms);
  console.log(`⏰ Próximo backup: ${next.toLocaleString('pt-BR')}`);
}

// ============ CHAPTER CACHE ============
let chaptersCache = null;
function loadChaptersCache() {
  const chaptersDir = path.join(__dirname, 'capitulos');
  try {
    const files = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.json'));
    chaptersCache = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(chaptersDir, f), 'utf8'));
      return data;
    });
    chaptersCache.sort((a, b) => a.id - b.id);
    console.log(`📚 ${chaptersCache.length} capítulos carregados em cache`);
  } catch (error) {
    chaptersCache = [];
  }
}

// Helper: run query and return results
function dbAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('❌ dbAll error:', error.message, 'SQL:', sql, 'Params:', params);
    return [];
  }
}

// Helper: run query and return single result
function dbGet(sql, params = []) {
  const results = dbAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Helper: run insert and return last ID
function dbRun(sql, params = []) {
  try {
    db.run(sql, params);
    const result = dbGet('SELECT last_insert_rowid() as id');
    saveDatabase();
    return result ? result.id : null;
  } catch (error) {
    console.error('❌ dbRun error:', error.message, 'SQL:', sql, 'Params:', params);
    return null;
  }
}

// Helper: run update/delete
function dbExec(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
  } catch (error) {
    console.error('❌ dbExec error:', error.message, 'SQL:', sql, 'Params:', params);
  }
}

// ============ AUTH MIDDLEWARE ============
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, secretQuestion, secretAnswer } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    
    if (!secretQuestion || !secretAnswer) {
      return res.status(400).json({ error: 'Pergunta secreta e resposta são obrigatórias' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    const existingUser = dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase().trim(), 10);
    const userId = dbRun(
      'INSERT INTO users (name, email, password, secret_question, secret_answer) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, secretQuestion, hashedAnswer]
    );
    
    const token = jwt.sign({ id: userId, name, email }, JWT_SECRET);
    
    res.json({ token, user: { id: userId, name, email } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Email ou senha incorretos' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email ou senha incorretos' });
    }
    
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
    
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = dbGet('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

// Forgot password - get secret question
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    const user = dbGet('SELECT id, secret_question FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Email não encontrado' });
    }
    
    if (!user.secret_question) {
      return res.status(400).json({ error: 'Esta conta não possui pergunta secreta configurada' });
    }
    
    res.json({ secretQuestion: user.secret_question });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Reset password with secret answer
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, secretAnswer, newPassword } = req.body;
    
    if (!email || !secretAnswer || !newPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' });
    }
    
    const user = dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Email não encontrado' });
    }
    
    if (!user.secret_answer) {
      return res.status(400).json({ error: 'Esta conta não possui pergunta secreta configurada' });
    }
    
    const validAnswer = await bcrypt.compare(secretAnswer.toLowerCase().trim(), user.secret_answer);
    if (!validAnswer) {
      return res.status(400).json({ error: 'Resposta incorreta' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    dbExec('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
    
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// ============ PROGRESS ROUTES ============

// Get user progress
app.get('/api/progress', authenticateToken, (req, res) => {
  const progress = dbAll('SELECT * FROM progress WHERE user_id = ?', [req.user.id]);
  res.json(progress);
});

// Update progress
app.post('/api/progress', authenticateToken, (req, res) => {
  const { chapterId, completed, maxBpm, practiceTime, testCompleted } = req.body;
  
  const existing = dbGet(
    'SELECT id FROM progress WHERE user_id = ? AND chapter_id = ?',
    [req.user.id, chapterId]
  );
  
  if (existing) {
    const updates = ['max_bpm = MAX(max_bpm, ?)', 'practice_time = practice_time + ?', 'last_practiced = CURRENT_TIMESTAMP'];
    const params = [maxBpm || 0, practiceTime || 0];
    
    if (typeof completed !== 'undefined' && completed !== null) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }
    if (typeof testCompleted !== 'undefined' && testCompleted !== null) {
      updates.push('test_completed = COALESCE(?, test_completed)');
      params.push(testCompleted ? 1 : null);
    }
    
    params.push(existing.id);
    dbExec(`UPDATE progress SET ${updates.join(', ')} WHERE id = ?`, params);
  } else {
    dbRun(`
      INSERT INTO progress (user_id, chapter_id, completed, max_bpm, practice_time, test_completed, last_practiced)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.id, chapterId, completed ? 1 : 0, maxBpm || 60, practiceTime || 0, testCompleted ? 1 : 0]);
  }
  
  res.json({ success: true });
});

// GET practice history (daily aggregate for heatmap)
app.get('/api/progress/history', authenticateToken, (req, res) => {
  const rows = dbAll(
    `SELECT practice_date, SUM(total_seconds) as total_seconds FROM (
      SELECT date(last_practiced) as practice_date, SUM(practice_time) as total_seconds
      FROM progress
      WHERE user_id = ? AND last_practiced IS NOT NULL AND practice_time > 0
      GROUP BY date(last_practiced)
      UNION ALL
      SELECT date(last_practiced) as practice_date, SUM(practice_time) as total_seconds
      FROM user_exercise_progress
      WHERE user_id = ? AND last_practiced IS NOT NULL AND practice_time > 0
      GROUP BY date(last_practiced)
    ) GROUP BY practice_date ORDER BY practice_date ASC`,
    [req.user.id, req.user.id]
  );
  res.json(rows);
});

// GET weekly + daily goals
app.get('/api/user/weekly-goal', authenticateToken, (req, res) => {
  const user = dbAll('SELECT weekly_goal, daily_goal FROM users WHERE id = ?', [req.user.id]);
  res.json({
    weeklyGoal: user.length ? user[0].weekly_goal || 60 : 60,
    dailyGoal: user.length ? user[0].daily_goal || 10 : 10
  });
});

// PUT weekly + daily goals
app.put('/api/user/weekly-goal', authenticateToken, (req, res) => {
  if (req.body.weeklyGoal !== undefined && req.body.weeklyGoal !== null) {
    const goal = Math.max(15, Math.min(600, parseInt(req.body.weeklyGoal) || 60));
    db.run('UPDATE users SET weekly_goal = ? WHERE id = ?', [goal, req.user.id]);
  }
  if (req.body.dailyGoal !== undefined && req.body.dailyGoal !== null) {
    const daily = Math.max(5, Math.min(240, parseInt(req.body.dailyGoal) || 10));
    db.run('UPDATE users SET daily_goal = ? WHERE id = ?', [daily, req.user.id]);
  }
  saveDatabase();
  const user = dbAll('SELECT weekly_goal, daily_goal FROM users WHERE id = ?', [req.user.id]);
  res.json({
    success: true,
    weeklyGoal: user.length ? user[0].weekly_goal || 60 : 60,
    dailyGoal: user.length ? user[0].daily_goal || 10 : 10
  });
});

// ============ EXERCÍCIOS PERSONALIZADOS ============

// GET listar exercícios do usuário (com progresso)
app.get('/api/user/exercises', authenticateToken, (req, res) => {
  const exercises = dbAll('SELECT * FROM user_exercises WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
  const progressList = dbAll('SELECT * FROM user_exercise_progress WHERE user_id = ?', [req.user.id]);
  const progressMap = {};
  for (const p of progressList) {
    progressMap[p.exercise_id] = p;
  }
  const result = exercises.map(ex => ({
    ...ex,
    sequencia: JSON.parse(ex.sequencia || '[]'),
    progress: progressMap[ex.id] || null
  }));
  res.json(result);
});

// POST criar exercício
app.post('/api/user/exercises', authenticateToken, (req, res) => {
  const { nome, sequencia, bpm_alvo, notes_per_beat, time_signature } = req.body;
  if (!nome || !sequencia || !Array.isArray(sequencia) || sequencia.length === 0) {
    return res.status(400).json({ error: 'Nome e sequência são obrigatórios' });
  }
  const seqJson = JSON.stringify(sequencia);
  const id = dbRun(
    `INSERT INTO user_exercises (user_id, nome, sequencia, bpm_alvo, notes_per_beat, time_signature)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, nome.trim(), seqJson, bpm_alvo || 60, notes_per_beat || 2, time_signature || 4]
  );
  // Cria registro de progresso
  dbRun(
    'INSERT INTO user_exercise_progress (user_id, exercise_id) VALUES (?, ?)',
    [req.user.id, id]
  );
  res.json({ id, success: true });
});

// PUT atualizar exercício
app.put('/api/user/exercises/:id', authenticateToken, (req, res) => {
  const { nome, sequencia, bpm_alvo, notes_per_beat, time_signature } = req.body;
  const ex = dbGet('SELECT * FROM user_exercises WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!ex) return res.status(404).json({ error: 'Exercício não encontrado' });
  const seqJson = sequencia ? JSON.stringify(sequencia) : ex.sequencia;
  dbExec(
    `UPDATE user_exercises SET nome = ?, sequencia = ?, bpm_alvo = ?, notes_per_beat = ?, time_signature = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    [nome || ex.nome, seqJson, bpm_alvo || ex.bpm_alvo, notes_per_beat || ex.notes_per_beat, time_signature || ex.time_signature, req.params.id, req.user.id]
  );
  res.json({ success: true });
});

// DELETE excluir exercício
app.delete('/api/user/exercises/:id', authenticateToken, (req, res) => {
  dbExec('DELETE FROM user_exercise_progress WHERE exercise_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  dbExec('DELETE FROM user_exercises WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// POST salvar progresso do exercício personalizado
app.post('/api/user/exercises/:id/progress', authenticateToken, (req, res) => {
  const { maxBpm, practiceTime, completed } = req.body;
  const prog = dbGet(
    'SELECT id FROM user_exercise_progress WHERE exercise_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (prog) {
    const updates = ['max_bpm = MAX(max_bpm, ?)', 'practice_time = practice_time + ?', 'last_practiced = CURRENT_TIMESTAMP'];
    const params = [maxBpm || 0, practiceTime || 0];
    if (typeof completed !== 'undefined') {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }
    params.push(prog.id);
    dbExec(`UPDATE user_exercise_progress SET ${updates.join(', ')} WHERE id = ?`, params);
  }
  res.json({ success: true });
});

// ============ ACHIEVEMENTS ============

const ACHIEVEMENTS = [
  // Progresso
  { id: 'first_chapter', name: 'Primeiro Capítulo', desc: 'Complete seu primeiro capítulo', icon: '📖' },
  { id: 'five_chapters', name: 'Pentacampeão', desc: 'Complete 5 capítulos', icon: '⭐' },
  { id: 'ten_chapters', name: 'Decacampeão', desc: 'Complete 10 capítulos', icon: '🌟' },
  { id: 'twenty_chapters', name: 'Veterano', desc: 'Complete 20 capítulos', icon: '💫' },
  { id: 'thirty_chapters', name: 'Guerreiro Experiente', desc: 'Complete 30 capítulos', icon: '🗡' },
  { id: 'forty_chapters', name: 'Cavaleiro', desc: 'Complete 40 capítulos', icon: '🛡' },
  { id: 'fifty_chapters', name: 'Lorde', desc: 'Complete 50 capítulos', icon: '👑' },
  { id: 'all_prep', name: 'Mestre do Preparatório', desc: 'Complete todo o módulo preparatório', icon: '⚔' },
  { id: 'all_main', name: 'Mestre do Módulo 1', desc: 'Complete todos os 66 capítulos', icon: '🏆' },
  { id: 'first_prep', name: 'Primeiros Passos', desc: 'Complete a primeira aula preparatória', icon: '👣' },
  { id: 'chapter_0', name: 'Portão de Entrada', desc: 'Complete o primeiro capítulo principal', icon: '🚪' },
  { id: 'chapter_56', name: 'Groove Final', desc: 'Complete o capítulo 56 — o desafio final', icon: '🏁' },

  // Velocidade
  { id: 'bpm_60', name: 'Passo Lento', desc: 'Pratique a 60 BPM', icon: '🐢' },
  { id: 'bpm_100', name: 'Velocidade 100', desc: 'Atinga 100 BPM', icon: '💨' },
  { id: 'bpm_150', name: 'Velocidade 150', desc: 'Atinga 150 BPM', icon: '🔥' },
  { id: 'bpm_180', name: 'Turbinado', desc: 'Atinga 180 BPM', icon: '⚡' },
  { id: 'bpm_200', name: 'Relâmpago', desc: 'Atinga 200 BPM', icon: '💥' },

  // Consistência
  { id: 'streak_1', name: 'Disciplina', desc: '1 dia consecutivo de prática', icon: '👉' },
  { id: 'streak_3', name: 'Consistente', desc: '3 dias consecutivos de prática', icon: '📅' },
  { id: 'streak_7', name: 'Dedicado', desc: '7 dias consecutivos de prática', icon: '📆' },
  { id: 'streak_14', name: 'Duas Semanas', desc: '14 dias consecutivos de prática', icon: '🗓' },
  { id: 'streak_30', name: 'Guerreiro', desc: '30 dias consecutivos de prática', icon: '🏅' },

  // Dedicação
  { id: 'practice_15m', name: 'Aquecimento', desc: '15 minutos totais de prática', icon: '🔥' },
  { id: 'practice_1h', name: 'Iniciante', desc: '1 hora total de prática', icon: '⏱' },
  { id: 'practice_5h', name: 'Persistente', desc: '5 horas total de prática', icon: '⏳' },
  { id: 'practice_10h', name: 'Incansável', desc: '10 horas total de prática', icon: '⌛' },
  { id: 'practice_50h', name: 'Lenda', desc: '50 horas total de prática', icon: '🏅' },
  { id: 'practice_100h', name: 'Lendário', desc: '100 horas total de prática', icon: '🗿' },
  { id: 'practice_200h', name: 'Imortal', desc: '200 horas total de prática', icon: '⚱' },

  // Testes
  { id: 'first_test', name: 'Testado', desc: 'Passe no primeiro teste', icon: '📝' },
  { id: 'five_tests', name: 'Estudante', desc: 'Passe em 5 testes', icon: '📚' },
  { id: 'fifteen_tests', name: 'Dedicado aos Estudos', desc: 'Passe em 15 testes', icon: '📖' },
  { id: 'twentyfive_tests', name: 'Sábio', desc: 'Passe em 25 testes', icon: '🔮' },
  { id: 'thirtyfive_tests', name: 'Mestre Acadêmico', desc: 'Passe em 35 testes', icon: '🎓' },
  { id: 'all_tests', name: 'Mestre dos Testes', desc: 'Passe em todos os 75 testes', icon: '🎯' },

  // Ritmos
  { id: 'rhythm_3', name: 'Aprendiz de Ritmos', desc: 'Complete 3 lições de ritmo', icon: '🥁' },
  { id: 'rhythm_6', name: 'Ritmista', desc: 'Complete 6 lições de ritmo', icon: '🪘' },
  { id: 'rhythm_all', name: 'Mestre dos Ritmos', desc: 'Complete todas as 9 lições de ritmo', icon: '🌍' },
  { id: 'rhythm_tests', name: 'Políglota Rítmico', desc: 'Passe em todos os testes de ritmo', icon: '🎼' }
];

// Check and unlock achievements
function checkAchievements(userId) {
  const progress = dbAll('SELECT * FROM progress WHERE user_id = ?', [userId]);
  const completedIds = progress.filter(p => p.completed).map(p => p.chapter_id);
  const testCompletedIds = progress.filter(p => p.test_completed).map(p => p.chapter_id);
  const totalPracticeTime = progress.reduce((sum, p) => sum + (p.practice_time || 0), 0);
  const maxBpmOverall = Math.max(...progress.map(p => p.max_bpm || 0), 0);
  
  // Get existing badges
  const existing = dbAll('SELECT badge_name FROM achievements WHERE user_id = ?', [userId]);
  const existingBadges = new Set(existing.map(a => a.badge_name));
  
  // Streak calculation (same as frontend)
  const practiceDates = [...new Set(progress.filter(p => p.last_practiced).map(p => p.last_practiced.split(' ')[0]))];
  practiceDates.sort().reverse();
  let streak = 0;
  const now = new Date();
  const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let d = 0; d < practiceDates.length; d++) {
    const expected = new Date(utcToday.getTime() - d * 86400000);
    if (practiceDates[d] === expected.toISOString().split('T')[0]) {
      streak++;
    } else {
      break;
    }
  }

  const prepComplete = completedIds.filter(id => id >= 100).length === 9;
  const mainComplete = completedIds.filter(id => id < 100).length === 66;
  const allTestsPassed = testCompletedIds.length === 75;

  const checks = [
    // Progresso
    { id: 'first_chapter', ok: completedIds.length >= 1 },
    { id: 'five_chapters', ok: completedIds.length >= 5 },
    { id: 'ten_chapters', ok: completedIds.length >= 10 },
    { id: 'twenty_chapters', ok: completedIds.length >= 20 },
    { id: 'thirty_chapters', ok: completedIds.length >= 30 },
    { id: 'forty_chapters', ok: completedIds.length >= 40 },
    { id: 'fifty_chapters', ok: completedIds.length >= 50 },
    { id: 'all_prep', ok: prepComplete },
    { id: 'all_main', ok: mainComplete },
    { id: 'first_prep', ok: completedIds.includes(100) },
    { id: 'chapter_0', ok: completedIds.includes(0) },
    { id: 'chapter_56', ok: completedIds.includes(56) },

    // Velocidade
    { id: 'bpm_60', ok: maxBpmOverall >= 60 },
    { id: 'bpm_100', ok: maxBpmOverall >= 100 },
    { id: 'bpm_150', ok: maxBpmOverall >= 150 },
    { id: 'bpm_180', ok: maxBpmOverall >= 180 },
    { id: 'bpm_200', ok: maxBpmOverall >= 200 },

    // Consistência
    { id: 'streak_1', ok: streak >= 1 },
    { id: 'streak_3', ok: streak >= 3 },
    { id: 'streak_7', ok: streak >= 7 },
    { id: 'streak_14', ok: streak >= 14 },
    { id: 'streak_30', ok: streak >= 30 },

    // Dedicação
    { id: 'practice_15m', ok: totalPracticeTime >= 900 },
    { id: 'practice_1h', ok: totalPracticeTime >= 3600 },
    { id: 'practice_5h', ok: totalPracticeTime >= 18000 },
    { id: 'practice_10h', ok: totalPracticeTime >= 36000 },
    { id: 'practice_50h', ok: totalPracticeTime >= 180000 },
    { id: 'practice_100h', ok: totalPracticeTime >= 360000 },
    { id: 'practice_200h', ok: totalPracticeTime >= 720000 },

    // Testes
    { id: 'first_test', ok: testCompletedIds.length >= 1 },
    { id: 'five_tests', ok: testCompletedIds.length >= 5 },
    { id: 'fifteen_tests', ok: testCompletedIds.length >= 15 },
    { id: 'twentyfive_tests', ok: testCompletedIds.length >= 25 },
    { id: 'thirtyfive_tests', ok: testCompletedIds.length >= 35 },
    { id: 'all_tests', ok: allTestsPassed },

    // Ritmos
    { id: 'rhythm_3', ok: completedIds.filter(id => id >= 57 && id <= 65).length >= 3 },
    { id: 'rhythm_6', ok: completedIds.filter(id => id >= 57 && id <= 65).length >= 6 },
    { id: 'rhythm_all', ok: completedIds.filter(id => id >= 57 && id <= 65).length === 9 },
    { id: 'rhythm_tests', ok: testCompletedIds.filter(id => id >= 57 && id <= 65).length === 9 }
  ];

  const unlocked = [];
  for (const c of checks) {
    if (c.ok && !existingBadges.has(c.id)) {
      dbRun('INSERT INTO achievements (user_id, badge_name) VALUES (?, ?)', [userId, c.id]);
      unlocked.push(c);
    }
  }
  return unlocked;
}

// GET achievements
app.get('/api/achievements', authenticateToken, (req, res) => {
  const achievements = dbAll('SELECT * FROM achievements WHERE user_id = ?', [req.user.id]);
  res.json({ achievements, all: ACHIEVEMENTS });
});

// POST check achievements
app.post('/api/achievements/check', authenticateToken, (req, res) => {
  const unlocked = checkAchievements(req.user.id);
  const details = unlocked.map(u => ACHIEVEMENTS.find(a => a.id === u.id));
  res.json({ new: details });
});

// ============ PUBLIC STATS (no auth needed) ============
app.get('/api/stats', (req, res) => {
  const chapters = chaptersCache || [];
  const totalAulas = chapters.length;
  let totalExercicios = 0;
  chapters.forEach(ch => {
    if (ch.exercise) totalExercicios += ch.exercise.length;
  });
  res.json({ totalAulas, totalExercicios });
});

// ============ CHAPTERS ROUTES ============

// Get all chapters
app.get('/api/chapters', authenticateToken, (req, res) => {
  res.json(chaptersCache || []);
});

// Get single chapter
app.get('/api/chapters/:id', authenticateToken, (req, res) => {
  const targetId = parseInt(req.params.id);
  const chapter = chaptersCache ? chaptersCache.find(c => c.id === targetId) : null;
  if (chapter) return res.json(chapter);
  res.status(404).json({ error: 'Capítulo não encontrado' });
});

// ============ SERVE PAGES ============
app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});

app.get('/dashboard', (req, res) => {
  res.sendFile('public/dashboard.html', { root: __dirname });
});

app.get('/intro', (req, res) => {
  res.sendFile('public/intro.html', { root: __dirname });
});

app.get('/curso', (req, res) => {
  res.sendFile('public/curso.html', { root: __dirname });
});

app.get('/teste', (req, res) => {
  res.sendFile('public/teste.html', { root: __dirname });
});

app.get('/faq', (req, res) => {
  res.sendFile('public/faq.html', { root: __dirname });
});

app.get('/conquistas', (req, res) => {
  res.sendFile('public/achievements.html', { root: __dirname });
});

app.get('/evolucao', (req, res) => {
  res.sendFile('public/evolucao.html', { root: __dirname });
});

app.get('/criar-exercicio', (req, res) => {
  res.sendFile('public/criar-exercicio.html', { root: __dirname });
});

//app.get('/', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'index.html'));
//});

//app.get('/dashboard', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
//});

//app.get('/intro', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'intro.html'));
//});

//app.get('/curso', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'curso.html'));
//});

//app.get('/teste', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'teste.html'));
//});

//app.get('/faq', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'faq.html'));/
//});

//app.get('/conquistas', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'achievements.html'));
//});

//app.get('/evolucao', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'evolucao.html'));
//});

//app.get('/criar-exercicio', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'criar-exercicio.html'));
//});

// ============ START ============

async function start() {
  await initDatabase();
  loadChaptersCache();

// Error handling

  process.on('uncaughtException', (err) => {
  console.error('❌ ERRO NÃO TRATADO:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMISE REJECTION:', reason);
});

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  next();
});
  
  app.listen(PORT, () => {
    console.log(`🎵 Do Travesseiro ao Groove rodando em http://localhost:${PORT}`);
  });
}

process.on('SIGINT', () => { saveDatabaseImmediate(); process.exit(); });
process.on('SIGTERM', () => { saveDatabaseImmediate(); process.exit(); });

start().catch(console.error);
