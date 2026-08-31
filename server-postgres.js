const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL Connection
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: DATABASE_URL não está definida!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com PostgreSQL:', err.message);
});
//const pool = new Pool({  connectionString: process.env.DATABASE_URL,  ssl: { rejectUnauthorized: false }});

let capitulos = [];
try {
  const capitulosDir = path.join(__dirname, 'capitulos');
  if (fs.existsSync(capitulosDir)) {
    const files = fs.readdirSync(capitulosDir).filter(f => f.endsWith('.json')).sort();
    capitulos = files.map(file => {
      const content = fs.readFileSync(path.join(capitulosDir, file), 'utf-8');
      return JSON.parse(content);
    });
    console.log(`📚 ${capitulos.length} capítulos carregados em cache`);
  }
} catch (err) {
  console.error('Erro ao carregar capítulos:', err.message);
}

// Testa conexão
pool.query('SELECT 1', (err, res) => {
  if (err) {
    console.error('❌ Falha ao conectar no PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL!');
  }
});

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        nome VARCHAR(255),
        pergunta_secreta VARCHAR(255),
        resposta_secreta_hash VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS progresso (
        id SERIAL PRIMARY KEY,
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        capitulo_id INT,
        exercicio_id INT,
        concluido BOOLEAN DEFAULT FALSE,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🗄️ Banco de dados inicializado');
  } catch (err) {
    console.error('Erro ao inicializar banco:', err.message);
  }
}

//app.post('/api/register', async (req, res) => {
app.post('/api/auth/register', async (req, res) => {    
  try {
    const { email, senha, pergunta_secreta, resposta_secreta } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const respostaHash = await bcrypt.hash(resposta_secreta, 10);

    const result = await pool.query(
      'INSERT INTO usuarios (email, senha_hash, pergunta_secreta, resposta_secreta_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, senhaHash, pergunta_secreta, respostaHash]
    );

    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET || 'seu_secret');
    res.status(201).json({ message: 'Usuário criado com sucesso', token, userId: result.rows[0].id });
  } catch (err) {
    console.error('Erro ao registrar:', err.message);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

//app.post('/api/login', async (req, res) => {
app.post('/api/auth/login', async (req, res) => {    
  try {
    const { email, senha } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const usuario = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ userId: usuario.id }, process.env.JWT_SECRET || 'seu_secret');
    res.json({ message: 'Login bem-sucedido', token, userId: usuario.id });
  } catch (err) {
    console.error('Erro ao fazer login:', err.message);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

//app.get('/api/chapters', (req, res) => {
app.get('/api/chapters', (req, res) => {    
  res.json(capitulos);
});

app.get('/api/chapters/:id', (req, res) => {
  const capitulo = capitulos.find(c => c.id === parseInt(req.params.id));
  if (!capitulo) return res.status(404).json({ error: 'Capítulo não encontrado' });
  res.json(capitulo);
});

app.post('/api/progress', async (req, res) => {
  try {
    const { userId, capituloId, exercicioId, concluido } = req.body;
    await pool.query(
      'INSERT INTO progresso (usuario_id, capitulo_id, exercicio_id, concluido) VALUES ($1, $2, $3, $4)',
      [userId, capituloId, exercicioId, concluido]
    );
    res.json({ message: 'Progresso salvo' });
  } catch (err) {
    console.error('Erro ao salvar progresso:', err.message);
    res.status(500).json({ error: 'Erro ao salvar progresso' });
  }
});

app.get('/api/progress/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM progresso WHERE usuario_id = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({ totalCapitulos: capitulos.length });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🎵 Do Travesseiro ao Groove rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Erro ao iniciar:', err.message);
    process.exit(1);
  }
}

start();