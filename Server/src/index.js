const express = require('express');
const cors = require('cors');
require('dotenv').config();
const apiRouter = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor Ortoo rodando em http://localhost:${PORT}`);
});
