const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Rota de Teste de Status da API e Banco
app.get('/api/status', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS resultado');
    res.json({ status: 'API Node.js Online', bancoConectado: true });
  } catch (error) {
    res.status(500).json({ status: 'Erro ao conectar no banco', erro: error.message });
  }
});

// Rota de Exemplo: Listar Categorias de Serviços
app.get('/api/servicos', async (req, res) => {
  try {
    const [servicos] = await db.query('SELECT * FROM categorias_servico');
    res.json(servicos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar categorias de serviço' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor Ortoo rodando em http://localhost:${PORT}`);
});