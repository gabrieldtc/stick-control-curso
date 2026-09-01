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
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase(), 10);
    
    const result = await pool.query(
      'INSERT INTO users (name, email, password, secret_question, secret_answer) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, hashedPassword, secretQuestion, hashedAnswer]
    );
    
    const userId = result.rows[0].id;
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ message: 'Usuário criado com sucesso', token, userId });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email já registrado' });
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
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ message: 'Login bem-sucedido', token, userId: user.id });
  } catch (err) {
    console.error('❌ Erro ao fazer login:', err.message);
    res.status(500).json({ error: 'Erro ao fazer login' });
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
app.get('/api/progress/:userId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM progress WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao buscar progresso:', err.message);
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
});

// Update progress
app.post('/api/progress', authenticateToken, async (req, res) => {
  try {
    const { userId, chapterId, completed, maxBpm, practiceTime, testCompleted } = req.body;
    
    const result = await pool.query(
      `INSERT INTO progress (user_id, chapter_id, completed, max_bpm, practice_time, test_completed, last_practiced)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, chapter_id) DO UPDATE SET
       completed = $3, max_bpm = $4, practice_time = $5, test_completed = $6, last_practiced = NOW()`,
      [userId, chapterId, completed, maxBpm, practiceTime, testCompleted]
    );
    
    res.json({ message: 'Progresso salvo com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao salvar progresso:', err.message);
    res.status(500).json({ error: 'Erro ao salvar progresso' });
  }
});

// ============ CUSTOM EXERCISES ROUTES ============

app.post('/api/exercises', authenticateToken, async (req, res) => {
  try {
    const { nome, sequencia, bpmAlvo, bpmRangeMin, bpmRangeMax, notesPerBeat, timeSignature } = req.body;
    
    const result = await pool.query(
      `INSERT INTO user_exercises (user_id, nome, sequencia, bpm_alvo, bpm_range_min, bpm_range_max, notes_per_beat, time_signature)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [req.user.userId, nome, sequencia, bpmAlvo, bpmRangeMin, bpmRangeMax, notesPerBeat, timeSignature]
    );
    
    res.status(201).json({ message: 'Exercício criado', exerciseId: result.rows[0].id });
  } catch (err) {
    console.error('❌ Erro ao criar exercício:', err.message);
    res.status(500).json({ error: 'Erro ao criar exercício' });
  }
});

app.get('/api/exercises/:userId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_exercises WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao buscar exercícios:', err.message);
    res.status(500).json({ error: 'Erro ao buscar exercícios' });
  }
});

// ============ ACHIEVEMENTS ROUTES ============

app.get('/api/achievements/:userId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT badge_name FROM achievements WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows.map(r => r.badge_name));
  } catch (err) {
    console.error('❌ Erro ao buscar achievements:', err.message);
    res.status(500).json({ error: 'Erro ao buscar achievements' });
  }
});

// ============ STATS ROUTE ============

app.get('/api/stats', async (req, res) => {
  try {
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const completions = await pool.query('SELECT COUNT(*) as count FROM progress WHERE completed = true');
    
    res.json({
      totalCapitulos: chaptersCache?.length || 0,
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