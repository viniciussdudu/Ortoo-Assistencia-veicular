const stripe = require('../config/stripe');
const db = require('../config/db');

// Permite salvar o cartão gratuitamente
async function criarSetupIntent(req, res) {
  const { usuario_id } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT stripe_customer_id, email, nome FROM usuarios WHERE id = ?',
      [usuario_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    let { stripe_customer_id, email, nome } = rows[0];

    if (!stripe_customer_id) {
      const customer = await stripe.customers.create({ email, name: nome });
      stripe_customer_id = customer.id;

      await db.query(
        'UPDATE usuarios SET stripe_customer_id = ? WHERE id = ?',
        [stripe_customer_id, usuario_id]
      );
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripe_customer_id,
      payment_method_types: ['card'],
    });

    res.json({ client_secret: setupIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: error.message });
  }
}

async function listarCartoes(req, res) {
  const usuario_id = req.query.usuario_id || req.params.usuario_id;

  if (!usuario_id) {
    return res.status(400).json({ erro: 'ID do usuário é obrigatório.' });
  }

  try {
    const [cartoes] = await db.query(
      `SELECT
        id,
        apelido,
        ultimos_digitos,
        bandeira,
        validade_mes,
        validade_ano,
        principal
       FROM cartoes_usuario
       WHERE usuario_id = ?
       ORDER BY principal DESC, criado_em DESC`,
      [usuario_id]
    );

    return res.json(cartoes);
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    return res.status(500).json({ erro: 'Erro interno ao listar cartões.' });
  }
}

async function criarTransacao(req, res) {
  const { solicitacao_id } = req.body;

  if (!solicitacao_id) {
    return res.status(400).json({ erro: 'Informe o id da solicitação.' });
  }

  try {
    const [solicitacoes] = await db.query(
      'SELECT id, valor_estimado FROM solicitacoes WHERE id = ?',
      [solicitacao_id]
    );

    if (solicitacoes.length === 0) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    }

    const valor = solicitacoes[0].valor_estimado ?? 0;
    const [resultado] = await db.query(
      `INSERT INTO transacoes (solicitacao_id, valor, status)
       VALUES (?, ?, 'pending')`,
      [solicitacao_id, valor]
    );

    return res.status(201).json({
      id: resultado.insertId,
      solicitacao_id: Number(solicitacao_id),
      valor,
      status: 'pending',
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return res.status(500).json({ erro: 'Erro interno ao criar transação.' });
  }
}

async function salvarCartao(req, res) {
  const { usuario_id, payment_method_id, ultimos_digitos, bandeira, validade_mes, validade_ano } = req.body;

  try {
    await db.query(
      `INSERT INTO cartoes_usuario 
        (usuario_id, gateway, token_gateway, ultimos_digitos, bandeira, validade_mes, validade_ano) 
       VALUES (?, 'stripe', ?, ?, ?, ?, ?)`,
      [usuario_id, payment_method_id, ultimos_digitos, bandeira, validade_mes, validade_ano]
    );

    res.json({ sucesso: true });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

// Declarada como função local padronizada
async function cobrarCartao(req, res) {
  const { transacao_id, metodo_pagamento } = req.body;

  try {
    const [transacoes] = await db.query(
      'SELECT * FROM transacoes WHERE id = ?',
      [transacao_id]
    );

    if (transacoes.length === 0) {
      return res.status(404).json({ erro: 'Transação não encontrada.' });
    }

    const transacao = transacoes[0];

    // Trata pagamentos PIX ou DINHEIRO diretamente sem exigir Stripe
    if (metodo_pagamento === 'PIX' || metodo_pagamento === 'DINHEIRO') {
      await db.query(
        "UPDATE transacoes SET status = 'PAGO' WHERE id = ?",
        [transacao_id]
      );

      await db.query(
        "UPDATE solicitacoes SET status = 'EM_ANDAMENTO' WHERE id = ?",
        [transacao.solicitacao_id]
      );

      return res.json({
        sucesso: true,
        mensagem: `Pagamento via ${metodo_pagamento} registrado com sucesso!`,
      });
    }

    // Lógica para Cartão de Crédito
    const [cartoes] = await db.query(
      'SELECT * FROM cartoes_usuario WHERE usuario_id = ? AND principal = 1',
      [transacao.usuario_id]
    );

    if (cartoes.length === 0) {
      return res.status(400).json({
        erro: 'Nenhum cartão principal encontrado para este usuário.',
      });
    }

    await db.query(
      "UPDATE transacoes SET status = 'PAGO' WHERE id = ?",
      [transacao_id]
    );

    return res.json({ sucesso: true, mensagem: 'Pagamento via Cartão realizado!' });
  } catch (error) {
    console.error('Erro na cobrança:', error);
    return res.status(500).json({ erro: error.message });
  }
}

module.exports = {
  criarSetupIntent,
  listarCartoes,
  criarTransacao,
  salvarCartao,
  cobrarCartao,
};