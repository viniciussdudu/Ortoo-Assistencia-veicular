const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
require('dotenv').config();
const apiRouter = require('./routes/api');
=======
const db = require('./config/db');
require('dotenv').config();
>>>>>>> Ortoo-proj/develop

const app = express();

app.use(cors());
app.use(express.json());
<<<<<<< HEAD
app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
=======

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
>>>>>>> Ortoo-proj/develop
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor Ortoo rodando em http://localhost:${PORT}`);
<<<<<<< HEAD
});
=======
});
>>>>>>> Ortoo-proj/develop
