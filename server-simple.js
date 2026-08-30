const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!' });
});

// Iniciar
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});