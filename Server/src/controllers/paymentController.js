const stripe = require('../config/stripe');
const db = require('../config/db');

// Permite salvar o cartão gratuitamente
async function criarSetupIntent(req, res) {
  const { usuario_id } = req.body;

  try {
    // Busca o usuário e verifica se ele já tem cliente stripe
    const [rows] = await db.query(
      'SELECT stripe_customer_id, email, nome FROM usuarios WHERE id = ?',
      [usuario_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    let { stripe_customer_id, email, nome } = rows[0];

    // Se não tiver, cria o cliente no Stripe e salva no banco
    if (!stripe_customer_id) {
      const customer = await stripe.customers.create({ email, name: nome });
      stripe_customer_id = customer.id;

      await db.query(
        'UPDATE usuarios SET stripe_customer_id = ? WHERE id = ?',
        [stripe_customer_id, usuario_id]
      );
    }

    // Cria o SetupIntent normalmente
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
  const { usuario_id } = req.params;

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
    return res.status(500).json({ erro: 'Erro interno ao listar cartões.' });  }
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

// Salvar o cartão no  banco
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

// Cobrar quando o serviço é concluído
async function cobrarCartao(req, res) {
  const { transacao_id } = req.body;

  if (!transacao_id) {
    return res.status(400).json({ erro: 'Informe o id da transação.' });
  }

  try {
    const [rows] = await db.query(`
      SELECT 
        t.id AS transacao_id,
        s.valor_estimado,
        u.stripe_customer_id,
        c.token_gateway
      FROM transacoes t
      JOIN solicitacoes s ON s.id = t.solicitacao_id
      JOIN usuarios u ON s.cliente_id = u.id
      JOIN cartoes_usuario c ON c.usuario_id = u.id
      WHERE t.id = ?
      ORDER BY c.principal DESC, c.criado_em DESC
      LIMIT 1
    `, [transacao_id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Transação, usuário ou cartão principal não encontrado.' });
    }

    const { valor_estimado, stripe_customer_id, token_gateway, transacao_id: id } = rows[0];

    if (!stripe_customer_id || !token_gateway) {
      return res.status(400).json({ erro: 'Usuário sem cartão cadastrado.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(valor_estimado * 100),
      currency: 'brl',
      customer: stripe_customer_id,
      payment_method: token_gateway,
      off_session: true,
      confirm: true,
    });

    await db.query(
      'UPDATE transacoes SET stripe_payment_intent_id = ?, valor = ?, status = ? WHERE id = ?',
      [paymentIntent.id, valor_estimado, paymentIntent.status, id]
    );

    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ erro: 'Pagamento não autorizado.', status: paymentIntent.status });
    }

    res.json({ sucesso: true, status: paymentIntent.status });
  } catch (error) {
    console.error(error);

    // Se o erro for do Stripe (ex: cartão recusado), registra na tabela também
    if (transacao_id) {
      await db.query(
        'UPDATE transacoes SET status = ? WHERE id = ?',
        ['failed', transacao_id]
      );
    }

    res.status(500).json({ erro: error.message });
  }
}

module.exports = {
  criarSetupIntent,
  listarCartoes,
  criarTransacao,
  salvarCartao,
  cobrarCartao,
};