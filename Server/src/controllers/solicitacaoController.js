const db = require("../config/db");

const CAMPOS_OBRIGATORIOS = ["cliente_id", "categoria_id", "latitude_origem", "longitude_origem"];

async function listarCategorias(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT id, nome, descricao, icone_url FROM categorias_servico ORDER BY nome"
    );
    return res.json(rows);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Nao foi possivel carregar as categorias." });
  }
}

// Server/src/controllers/solicitacaoController.js

async function criarSolicitacao(req, res) {
  const { cliente_id, categoria_id, latitude_origem, longitude_origem, descricao_problema } = req.body;

  try {
    // 1. Cancela automaticamente qualquer solicitação 'PENDENTE' anterior do mesmo cliente
    await db.query(
      `UPDATE solicitacoes 
       SET status = 'CANCELADO' 
       WHERE cliente_id = ? AND status = 'PENDENTE'`,
      [cliente_id]
    );

    // 2. Insere a nova solicitação
    const [resultado] = await db.query(
      `INSERT INTO solicitacoes 
        (cliente_id, categoria_id, latitude_origem, longitude_origem, descricao_problema, status) 
       VALUES (?, ?, ?, ?, ?, 'PENDENTE')`,
      [cliente_id, categoria_id, latitude_origem, longitude_origem, descricao_problema]
    );

    return res.status(201).json({
      id: resultado.insertId,
      cliente_id,
      categoria_id,
      status: 'PENDENTE',
    });
  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    return res.status(500).json({ erro: error.message });
  }
}

async function listarSolicitacoesCliente(req, res) {
  const { cliente_id } = req.query;
  if (!cliente_id) {
    return res.status(400).json({ erro: "Informe o cliente_id." });
  }

  try {
    const [rows] = await db.query(
      `SELECT s.id, s.status, s.descricao_problema, s.latitude_origem, s.longitude_origem,
              s.valor_estimado, s.criado_em, c.nome AS categoria_nome
         FROM solicitacoes s
         JOIN categorias_servico c ON c.id = s.categoria_id
        WHERE s.cliente_id = ?
        ORDER BY s.criado_em DESC`,
      [cliente_id]
    );
    return res.json(rows);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Nao foi possivel carregar as solicitacoes." });
  }
}

async function cancelarSolicitacao(req, res) {
  const { id } = req.params;

  try {
    const [resultado] = await db.query(
      "UPDATE solicitacoes SET status = 'CANCELADO' WHERE id = ? AND status IN ('PENDENTE', 'ACEITO')",
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(409).json({ erro: "Solicitacao inexistente ou nao pode mais ser cancelada." });
    }

    return res.json({ sucesso: true, mensagem: "Solicitacao cancelada." });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Nao foi possivel cancelar a solicitacao." });
  }
}

module.exports = { listarCategorias, criarSolicitacao, listarSolicitacoesCliente, cancelarSolicitacao };