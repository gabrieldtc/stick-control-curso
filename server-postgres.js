const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// ============ SETUP ============
process.on('uncaughtException', (err) => {
  console.error('⚠️ Erro não capturado:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Promise rejeitada:', reason instanceof Error ? reason.message : reason);
});

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'stick-control-secret-2024';

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ PostgreSQL CONNECTION ============
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: DATABASE_URL não está definida!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        secret_question VARCHAR(255),
        secret_answer VARCHAR(255),
        weekly_goal INTEGER DEFAULT 60,
        daily_goal INTEGER DEFAULT 10
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        chapter_id INTEGER NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        max_bpm INTEGER DEFAULT 60,
        practice_time INTEGER DEFAULT 0,
        test_completed BOOLEAN DEFAULT FALSE,
        last_practiced TIMESTAMP,
        UNIQUE(user_id, chapter_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_name VARCHAR(255) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_exercises (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        sequencia TEXT NOT NULL,
        bpm_alvo INTEGER DEFAULT 60,
        bpm_range_min INTEGER DEFAULT 40,
        bpm_range_max INTEGER DEFAULT 200,
        notes_per_beat INTEGER DEFAULT 2,
        time_signature INTEGER DEFAULT 4,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_exercise_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL,
        max_bpm INTEGER DEFAULT 0,
        practice_time INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        last_practiced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ MIGRAÇÕES (garante colunas em bancos criados por versões antigas) ============
    const migrations = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS secret_question VARCHAR(255)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS secret_answer VARCHAR(255)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 60",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 10",
      "ALTER TABLE progress ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE",
      "ALTER TABLE progress ADD COLUMN IF NOT EXISTS max_bpm INTEGER DEFAULT 60",
      "ALTER TABLE progress ADD COLUMN IF NOT EXISTS practice_time INTEGER DEFAULT 0",
      "ALTER TABLE progress ADD COLUMN IF NOT EXISTS test_completed BOOLEAN DEFAULT FALSE",
      "ALTER TABLE progress ADD COLUMN IF NOT EXISTS last_practiced TIMESTAMP",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_user_chapter ON progress(user_id, chapter_id)",
      "ALTER TABLE user_exercises ADD COLUMN IF NOT EXISTS bpm_range_min INTEGER DEFAULT 40",
      "ALTER TABLE user_exercises ADD COLUMN IF NOT EXISTS bpm_range_max INTEGER DEFAULT 200",
      "ALTER TABLE user_exercises ADD COLUMN IF NOT EXISTS notes_per_beat INTEGER DEFAULT 2",
      "ALTER TABLE user_exercises ADD COLUMN IF NOT EXISTS time_signature INTEGER DEFAULT 4",
      "ALTER TABLE user_exercises ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE user_exercises ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE user_exercise_progress ADD COLUMN IF NOT EXISTS max_bpm INTEGER DEFAULT 0",
      "ALTER TABLE user_exercise_progress ADD COLUMN IF NOT EXISTS practice_time INTEGER DEFAULT 0",
      "ALTER TABLE user_exercise_progress ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE",
      "ALTER TABLE user_exercise_progress ADD COLUMN IF NOT EXISTS last_practiced TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE achievements ADD COLUMN IF NOT EXISTS badge_name VARCHAR(255)",
      "ALTER TABLE achievements ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ];
    for (const sql of migrations) {
      try {
        await pool.query(sql);
      } catch (e) {
        // ignora erros (ex: duplicado / coluna já existe)
      }
    }

    console.log('✅ Banco PostgreSQL inicializado');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
  }
}


//pool.on('error', (err) => {
//  console.error('❌ Erro na conexão com PostgreSQL:', err.message);
//});

// ============ DATABASE INITIALIZATION ============
//async function initDatabase() {
//  try {
    // Tabela users
//    await pool.query(`
//      CREATE TABLE IF NOT EXISTS users (
//        id SERIAL PRIMARY KEY,
//        name VARCHAR(255) NOT NULL,
 //       email VARCHAR(255) UNIQUE NOT NULL,
//        password VARCHAR(255) NOT NULL,
//        secret_question VARCHAR(255),
//        secret_answer VARCHAR(255),
 //       weekly_goal INTEGER DEFAULT 60,
//        daily_goal INTEGER DEFAULT 10,
//        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//      )
//    `);

    // Tabela progress
//    await pool.query(`
//      CREATE TABLE IF NOT EXISTS progress (
 //       id SERIAL PRIMARY KEY,
 //       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 //       chapter_id INTEGER NOT NULL,
 //       completed BOOLEAN DEFAULT FALSE,
 //       max_bpm INTEGER DEFAULT 60,
 //       practice_time INTEGER DEFAULT 0,
 //       test_completed BOOLEAN DEFAULT FALSE,
 //       last_practiced TIMESTAMP,
 //       UNIQUE(user_id, chapter_id)
 //     )
 //   `);

    // Tabela achievements
///    await pool.query(`
 //     CREATE TABLE IF NOT EXISTS achievements (
 //       id SERIAL PRIMARY KEY,
  //      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 //       badge_name VARCHAR(255) NOT NULL,
 //       unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 //     )
 //   `);

    // Tabela user_exercises
//    await pool.query(`
//      CREATE TABLE IF NOT EXISTS user_exercises (
//        id SERIAL PRIMARY KEY,
//        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 //       nome VARCHAR(255) NOT NULL,
 //       sequencia TEXT NOT NULL,
 //       bpm_alvo INTEGER DEFAULT 60,
 //       bpm_range_min INTEGER DEFAULT 40,
 //       bpm_range_max INTEGER DEFAULT 200,
  //      notes_per_beat INTEGER DEFAULT 2,
 //       time_signature INTEGER DEFAULT 4,
 //       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 //       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 //     )
 //   `);

    // Tabela user_exercise_progress
//    await pool.query(`
//      CREATE TABLE IF NOT EXISTS user_exercise_progress (
//        id SERIAL PRIMARY KEY,
 //       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//        exercise_id INTEGER NOT NULL,
//        max_bpm INTEGER DEFAULT 0,
//        practice_time INTEGER DEFAULT 0,
//        completed BOOLEAN DEFAULT FALSE,
//        last_practiced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//      )
//    `);

//    console.log('✅ Banco de dados PostgreSQL inicializado');
//  } catch (err) {
//    console.error('❌ Erro ao inicializar banco:', err.message);
//  }
//}

// ============ CHAPTERS CACHE ============
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
    console.error('⚠️ Erro ao carregar capítulos:', error.message);
    chaptersCache = [];
  }
}

// ============ AUTH MIDDLEWARE ============
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Token inválido ou expirado' });
    // Normaliza o ID do usuário: aceita tokens antigos (userId) e novos (id)
    req.user = user;
    if (req.user.id === undefined && req.user.userId !== undefined) {
      req.user.id = req.user.userId;
    }
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
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase().trim(), 10);
    
    const result = await pool.query(
      'INSERT INTO users (name, email, password, secret_question, secret_answer) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, hashedPassword, secretQuestion, hashedAnswer]
    );
    
    const userId = result.rows[0].id;
    const token = jwt.sign({ id: userId, name, email }, JWT_SECRET);
    
    res.json({ token, user: { id: userId, name, email } });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error('❌ Erro ao registrar:', err.message);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
    
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('❌ Erro ao fazer login:', err.message);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erro ao buscar usuário:', err.message);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Forgot password - get secret question
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });
    
    const result = await pool.query('SELECT secret_question FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Email não encontrado' });
    
    if (!result.rows[0].secret_question) {
      return res.status(400).json({ error: 'Esta conta não possui pergunta secreta configurada' });
    }
    
    res.json({ secretQuestion: result.rows[0].secret_question });
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
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Email não encontrado' });
    
    const user = result.rows[0];
    if (!user.secret_answer) {
      return res.status(400).json({ error: 'Esta conta não possui pergunta secreta configurada' });
    }
    
    const validAnswer = await bcrypt.compare(secretAnswer.toLowerCase().trim(), user.secret_answer);
    if (!validAnswer) return res.status(400).json({ error: 'Resposta incorreta' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
    
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// ============ USER ROUTES ============

// Get user profile
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, weekly_goal, daily_goal FROM users WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erro ao buscar usuário:', err.message);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// ============ CHAPTER ROUTES ============

app.get('/api/chapters', (req, res) => {
  res.json(chaptersCache || []);
});

app.get('/api/chapters/:id', (req, res) => {
  const chapter = chaptersCache?.find(c => c.id === parseInt(req.params.id));
  if (!chapter) {
    return res.status(404).json({ error: 'Capítulo não encontrado' });
  }
  res.json(chapter);
});

// ============ PROGRESS ROUTES ============

// Get user progress
app.get('/api/progress', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM progress WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao buscar progresso:', err.message);
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
});

// Update progress
app.post('/api/progress', authenticateToken, async (req, res) => {
  try {
    const { chapterId, completed, maxBpm, practiceTime, testCompleted } = req.body;

    // Offset de fuso do navegador (minutos a somar ao UTC p/ chegar na hora local).
    // Usado para gravar last_practiced na data local do usuário, evitando que a
    // meta diária (que compara com o dia local) fique zerada por diferença de fuso.
    const tzMin = parseInt(req.body.timezoneOffsetMin) || 0;
    const tzExpr = tzMin === 0 ? 'NOW()' : `NOW() - (${tzMin} * interval '1 minute')`;
    
    const existing = await pool.query(
      'SELECT id FROM progress WHERE user_id = $1 AND chapter_id = $2',
      [req.user.id, chapterId]
    );
    
    if (existing.rows.length > 0) {
      let updates = ['max_bpm = GREATEST(max_bpm, $1)', 'practice_time = practice_time + $2', `last_practiced = ${tzExpr}`];
      let params = [maxBpm || 0, practiceTime || 0];
      
      if (typeof completed !== 'undefined' && completed !== null) {
        updates.push('completed = $' + (params.length + 1));
        params.push(completed ? true : false);
      }
      if (typeof testCompleted !== 'undefined' && testCompleted !== null) {
        updates.push('test_completed = COALESCE($' + (params.length + 1) + ', test_completed)');
        params.push(testCompleted ? true : null);
      }
      
      params.push(existing.rows[0].id);
      await pool.query(`UPDATE progress SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    } else {
      await pool.query(
        `INSERT INTO progress (user_id, chapter_id, completed, max_bpm, practice_time, test_completed, last_practiced)
         VALUES ($1, $2, $3, $4, $5, $6, ${tzExpr})`,
        [req.user.id, chapterId, completed ? true : false, maxBpm || 60, practiceTime || 0, testCompleted ? true : false]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erro ao salvar progresso:', err.message);
    res.status(500).json({ error: 'Erro ao salvar progresso' });
  }
});

// GET practice history (daily aggregate for heatmap)
app.get('/api/progress/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT to_char(practice_date, 'YYYY-MM-DD') as practice_date, SUM(total_seconds) as total_seconds FROM (
        SELECT date(last_practiced) as practice_date, SUM(practice_time) as total_seconds
        FROM progress
        WHERE user_id = $1 AND last_practiced IS NOT NULL AND practice_time > 0
        GROUP BY date(last_practiced)
        UNION ALL
        SELECT date(last_practiced) as practice_date, SUM(practice_time) as total_seconds
        FROM user_exercise_progress
        WHERE user_id = $1 AND last_practiced IS NOT NULL AND practice_time > 0
        GROUP BY date(last_practiced)
      ) t GROUP BY practice_date ORDER BY practice_date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao buscar histórico:', err.message);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// GET weekly + daily goals
app.get('/api/user/weekly-goal', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT weekly_goal, daily_goal FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0] || {};
    res.json({
      weeklyGoal: user.weekly_goal !== null && user.weekly_goal !== undefined ? user.weekly_goal : 60,
      dailyGoal: user.daily_goal !== null && user.daily_goal !== undefined ? user.daily_goal : 10
    });
  } catch (err) {
    console.error('❌ Erro ao buscar metas:', err.message);
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
});

// PUT weekly + daily goals
app.put('/api/user/weekly-goal', authenticateToken, async (req, res) => {
  try {
    if (req.body.weeklyGoal !== undefined && req.body.weeklyGoal !== null) {
      const goal = Math.max(15, Math.min(600, parseInt(req.body.weeklyGoal) || 60));
      await pool.query('UPDATE users SET weekly_goal = $1 WHERE id = $2', [goal, req.user.id]);
    }
    if (req.body.dailyGoal !== undefined && req.body.dailyGoal !== null) {
      const daily = Math.max(5, Math.min(240, parseInt(req.body.dailyGoal) || 10));
      await pool.query('UPDATE users SET daily_goal = $1 WHERE id = $2', [daily, req.user.id]);
    }
    const result = await pool.query('SELECT weekly_goal, daily_goal FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0] || {};
    res.json({
      success: true,
      weeklyGoal: user.weekly_goal !== undefined ? user.weekly_goal : 60,
      dailyGoal: user.daily_goal !== undefined ? user.daily_goal : 10
    });
  } catch (err) {
    console.error('❌ Erro ao salvar metas:', err.message);
    res.status(500).json({ error: 'Erro ao salvar metas' });
  }
});

// ============ EXERCÍCIOS PERSONALIZADOS ============

// GET listar exercícios do usuário (com progresso)
app.get('/api/user/exercises', authenticateToken, async (req, res) => {
  try {
    const exercisesResult = await pool.query('SELECT * FROM user_exercises WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.id]);
    const progressResult = await pool.query('SELECT * FROM user_exercise_progress WHERE user_id = $1', [req.user.id]);
    
    const progressMap = {};
    for (const p of progressResult.rows) {
      progressMap[p.exercise_id] = p;
    }
    
    const result = exercisesResult.rows.map(ex => ({
      ...ex,
      sequencia: JSON.parse(ex.sequencia || '[]'),
      progress: progressMap[ex.id] || null
    }));
    
    res.json(result);
  } catch (err) {
    console.error('❌ Erro ao buscar exercícios:', err.message);
    res.status(500).json({ error: 'Erro ao buscar exercícios' });
  }
});

// POST criar exercício
app.post('/api/user/exercises', authenticateToken, async (req, res) => {
  try {
    const { nome, sequencia, bpm_alvo, notes_per_beat, time_signature } = req.body;
    if (!nome || !sequencia || !Array.isArray(sequencia) || sequencia.length === 0) {
      return res.status(400).json({ error: 'Nome e sequência são obrigatórios' });
    }
    const seqJson = JSON.stringify(sequencia);
    
    const result = await pool.query(
      `INSERT INTO user_exercises (user_id, nome, sequencia, bpm_alvo, notes_per_beat, time_signature)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, nome.trim(), seqJson, bpm_alvo || 60, notes_per_beat || 2, time_signature || 4]
    );
    const id = result.rows[0].id;
    
    await pool.query(
      'INSERT INTO user_exercise_progress (user_id, exercise_id) VALUES ($1, $2)',
      [req.user.id, id]
    );
    
    res.json({ id, success: true });
  } catch (err) {
    console.error('❌ Erro ao criar exercício:', err.message);
    res.status(500).json({ error: 'Erro ao criar exercício' });
  }
});

// PUT atualizar exercício
app.put('/api/user/exercises/:id', authenticateToken, async (req, res) => {
  try {
    const { nome, sequencia, bpm_alvo, notes_per_beat, time_signature } = req.body;
    const exResult = await pool.query('SELECT * FROM user_exercises WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (exResult.rows.length === 0) return res.status(404).json({ error: 'Exercício não encontrado' });
    
    const ex = exResult.rows[0];
    const seqJson = sequencia ? JSON.stringify(sequencia) : ex.sequencia;
    
    await pool.query(
      `UPDATE user_exercises SET nome = $1, sequencia = $2, bpm_alvo = $3, notes_per_beat = $4, time_signature = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7`,
      [nome || ex.nome, seqJson, bpm_alvo || ex.bpm_alvo, notes_per_beat || ex.notes_per_beat, time_signature || ex.time_signature, req.params.id, req.user.id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erro ao atualizar exercício:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar exercício' });
  }
});

// DELETE excluir exercício
app.delete('/api/user/exercises/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_exercise_progress WHERE exercise_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    await pool.query('DELETE FROM user_exercises WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erro ao excluir exercício:', err.message);
    res.status(500).json({ error: 'Erro ao excluir exercício' });
  }
});

// POST salvar progresso do exercício personalizado
app.post('/api/user/exercises/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { maxBpm, practiceTime, completed } = req.body;
    const tzMin = parseInt(req.body.timezoneOffsetMin) || 0;
    const tzExpr = tzMin === 0 ? 'NOW()' : `NOW() - (${tzMin} * interval '1 minute')`;
    const progResult = await pool.query(
      'SELECT id FROM user_exercise_progress WHERE exercise_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (progResult.rows.length > 0) {
      let updates = ['max_bpm = GREATEST(max_bpm, $1)', 'practice_time = practice_time + $2', `last_practiced = ${tzExpr}`];
      let params = [maxBpm || 0, practiceTime || 0];
      if (typeof completed !== 'undefined') {
        updates.push('completed = $' + (params.length + 1));
        params.push(completed ? true : false);
      }
      params.push(progResult.rows[0].id);
      await pool.query(`UPDATE user_exercise_progress SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erro ao salvar progresso do exercício:', err.message);
    res.status(500).json({ error: 'Erro ao salvar progresso' });
  }
});

// ============ ACHIEVEMENTS ============

const ACHIEVEMENTS = [
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
  { id: 'bpm_60', name: 'Passo Lento', desc: 'Pratique a 60 BPM', icon: '🐢' },
  { id: 'bpm_100', name: 'Velocidade 100', desc: 'Atinga 100 BPM', icon: '💨' },
  { id: 'bpm_150', name: 'Velocidade 150', desc: 'Atinga 150 BPM', icon: '🔥' },
  { id: 'bpm_180', name: 'Turbinado', desc: 'Atinga 180 BPM', icon: '⚡' },
  { id: 'bpm_200', name: 'Relâmpago', desc: 'Atinga 200 BPM', icon: '💥' },
  { id: 'streak_1', name: 'Disciplina', desc: '1 dia consecutivo de prática', icon: '👉' },
  { id: 'streak_3', name: 'Consistente', desc: '3 dias consecutivos de prática', icon: '📅' },
  { id: 'streak_7', name: 'Dedicado', desc: '7 dias consecutivos de prática', icon: '📆' },
  { id: 'streak_14', name: 'Duas Semanas', desc: '14 dias consecutivos de prática', icon: '🗓' },
  { id: 'streak_30', name: 'Guerreiro', desc: '30 dias consecutivos de prática', icon: '🏅' },
  { id: 'practice_15m', name: 'Aquecimento', desc: '15 minutos totais de prática', icon: '🔥' },
  { id: 'practice_1h', name: 'Iniciante', desc: '1 hora total de prática', icon: '⏱' },
  { id: 'practice_5h', name: 'Persistente', desc: '5 horas total de prática', icon: '⏳' },
  { id: 'practice_10h', name: 'Incansável', desc: '10 horas total de prática', icon: '⌛' },
  { id: 'practice_50h', name: 'Lenda', desc: '50 horas total de prática', icon: '🏅' },
  { id: 'practice_100h', name: 'Lendário', desc: '100 horas total de prática', icon: '🗿' },
  { id: 'practice_200h', name: 'Imortal', desc: '200 horas total de prática', icon: '⚱' },
  { id: 'first_test', name: 'Testado', desc: 'Passe no primeiro teste', icon: '📝' },
  { id: 'five_tests', name: 'Estudante', desc: 'Passe em 5 testes', icon: '📚' },
  { id: 'fifteen_tests', name: 'Dedicado aos Estudos', desc: 'Passe em 15 testes', icon: '📖' },
  { id: 'twentyfive_tests', name: 'Sábio', desc: 'Passe em 25 testes', icon: '🔮' },
  { id: 'thirtyfive_tests', name: 'Mestre Acadêmico', desc: 'Passe em 35 testes', icon: '🎓' },
  { id: 'all_tests', name: 'Mestre dos Testes', desc: 'Passe em todos os 75 testes', icon: '🎯' },
  { id: 'rhythm_3', name: 'Aprendiz de Ritmos', desc: 'Complete 3 lições de ritmo', icon: '🥁' },
  { id: 'rhythm_6', name: 'Ritmista', desc: 'Complete 6 lições de ritmo', icon: '🪘' },
  { id: 'rhythm_all', name: 'Mestre dos Ritmos', desc: 'Complete todas as 9 lições de ritmo', icon: '🌍' },
  { id: 'rhythm_tests', name: 'Políglota Rítmico', desc: 'Passe em todos os testes de ritmo', icon: '🎼' }
];

// Check and unlock achievements
async function checkAchievements(userId) {
  const progressResult = await pool.query('SELECT * FROM progress WHERE user_id = $1', [userId]);
  const progress = progressResult.rows;
  const completedIds = progress.filter(p => p.completed).map(p => p.chapter_id);
  const testCompletedIds = progress.filter(p => p.test_completed).map(p => p.chapter_id);
  const totalPracticeTime = progress.reduce((sum, p) => sum + (p.practice_time || 0), 0);
  const maxBpmOverall = progress.reduce((mx, p) => Math.max(mx, p.max_bpm || 0), 0);

  const existingResult = await pool.query('SELECT badge_name FROM achievements WHERE user_id = $1', [userId]);
  const existingBadges = new Set(existingResult.rows.map(a => a.badge_name));

  const practiceDates = [...new Set(progress.filter(p => p.last_practiced).map(p => new Date(p.last_practiced).toISOString().split('T')[0]))];
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
    { id: 'bpm_60', ok: maxBpmOverall >= 60 },
    { id: 'bpm_100', ok: maxBpmOverall >= 100 },
    { id: 'bpm_150', ok: maxBpmOverall >= 150 },
    { id: 'bpm_180', ok: maxBpmOverall >= 180 },
    { id: 'bpm_200', ok: maxBpmOverall >= 200 },
    { id: 'streak_1', ok: streak >= 1 },
    { id: 'streak_3', ok: streak >= 3 },
    { id: 'streak_7', ok: streak >= 7 },
    { id: 'streak_14', ok: streak >= 14 },
    { id: 'streak_30', ok: streak >= 30 },
    { id: 'practice_15m', ok: totalPracticeTime >= 900 },
    { id: 'practice_1h', ok: totalPracticeTime >= 3600 },
    { id: 'practice_5h', ok: totalPracticeTime >= 18000 },
    { id: 'practice_10h', ok: totalPracticeTime >= 36000 },
    { id: 'practice_50h', ok: totalPracticeTime >= 180000 },
    { id: 'practice_100h', ok: totalPracticeTime >= 360000 },
    { id: 'practice_200h', ok: totalPracticeTime >= 720000 },
    { id: 'first_test', ok: testCompletedIds.length >= 1 },
    { id: 'five_tests', ok: testCompletedIds.length >= 5 },
    { id: 'fifteen_tests', ok: testCompletedIds.length >= 15 },
    { id: 'twentyfive_tests', ok: testCompletedIds.length >= 25 },
    { id: 'thirtyfive_tests', ok: testCompletedIds.length >= 35 },
    { id: 'all_tests', ok: allTestsPassed },
    { id: 'rhythm_3', ok: completedIds.filter(id => id >= 57 && id <= 65).length >= 3 },
    { id: 'rhythm_6', ok: completedIds.filter(id => id >= 57 && id <= 65).length >= 6 },
    { id: 'rhythm_all', ok: completedIds.filter(id => id >= 57 && id <= 65).length === 9 },
    { id: 'rhythm_tests', ok: testCompletedIds.filter(id => id >= 57 && id <= 65).length === 9 }
  ];

  const unlocked = [];
  for (const c of checks) {
    if (c.ok && !existingBadges.has(c.id)) {
      await pool.query('INSERT INTO achievements (user_id, badge_name) VALUES ($1, $2)', [userId, c.id]);
      unlocked.push(c);
    }
  }
  return unlocked;
}

// GET achievements
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements WHERE user_id = $1', [req.user.id]);
    res.json({ achievements: result.rows, all: ACHIEVEMENTS });
  } catch (err) {
    console.error('❌ Erro ao buscar achievements:', err.message);
    res.status(500).json({ error: 'Erro ao buscar achievements' });
  }
});

// POST check achievements
app.post('/api/achievements/check', authenticateToken, async (req, res) => {
  try {
    const unlocked = await checkAchievements(req.user.id);
    const details = unlocked.map(u => ACHIEVEMENTS.find(a => a.id === u.id));
    res.json({ new: details });
  } catch (err) {
    console.error('❌ Erro ao checar achievements:', err.message);
    res.status(500).json({ error: 'Erro ao checar achievements' });
  }
});

// ============ STATS ROUTE ============

app.get('/api/stats', async (req, res) => {
  try {
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const completions = await pool.query('SELECT COUNT(*) as count FROM progress WHERE completed = true');
    
    res.json({
      totalAulas: chaptersCache?.length || 0,
      totalUsuarios: userCount.rows[0].count,
      capitulosCompletados: completions.rows[0].count
    });
  } catch (err) {
    console.error('❌ Erro ao buscar stats:', err.message);
    res.status(500).json({ error: 'Erro ao buscar stats' });
  }
});

// ============ PAGE ROUTES ============

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/intro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intro.html'));
});

app.get('/curso', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'curso.html'));
});

app.get('/teste', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teste.html'));
});

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});

app.get('/conquistas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'achievements.html'));
});

app.get('/evolucao', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'evolucao.html'));
});

app.get('/criar-exercicio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'criar-exercicio.html'));
});

// ============ START SERVER ============

async function start() {
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Conectado ao PostgreSQL!');
    
    // Initialize database
    await initDatabase();
    
    // Load chapters
    loadChaptersCache();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🎵 Do Travesseiro ao Groove rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

start();