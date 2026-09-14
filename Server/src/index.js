const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carrega as variáveis de ambiente uma única vez no topo

const db = require('./config/db');
const apiRouter = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());

// Rota de Teste de Status da API e Banco
app.get('/api/status', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS resultado');
    res.json({ status: 'API Node.js Online', bancoConectado: true });
  } catch (error) {
    res.status(500).json({ status: 'Erro ao conectar no banco', erro: error.message, code: error.code });
  }
});

// Rota de Exemplo: Listar Usuários
app.get('/api/usuarios', async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT nome FROM usuarios');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
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

// Rotas principais da aplicação
app.use('/api', apiRouter);

// Tratamento de Rota Não Encontrada (404)
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Tratamento Global de Erros (500)
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Ortoo rodando em http://localhost:${PORT}`);
});