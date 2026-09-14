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

async function criarSolicitacao(req, res) {
  // TODO: quando houver sessao, tirar cliente_id do body e ler do usuario autenticado.
  const { cliente_id, categoria_id, descricao_problema, latitude_origem, longitude_origem } = req.body;

  const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => req.body[campo] === undefined || req.body[campo] === null);
  if (faltando.length > 0) {
    return res.status(400).json({ erro: `Campos obrigatorios ausentes: ${faltando.join(", ")}.` });
  }

  const lat = Number(latitude_origem);
  const lng = Number(longitude_origem);
  if (Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lng) || lng < -180 || lng > 180) {
    return res.status(400).json({ erro: "Coordenadas invalidas." });
  }

  try {
    const [pendentes] = await db.query(
      "SELECT id FROM solicitacoes WHERE cliente_id = ? AND status IN ('PENDENTE', 'ACEITO', 'EM_ANDAMENTO') LIMIT 1",
      [cliente_id]
    );
    if (pendentes.length > 0) {
      return res.status(409).json({ erro: "Voce ja possui uma solicitacao em andamento." });
    }

    const [resultado] = await db.query(
      `INSERT INTO solicitacoes
        (cliente_id, categoria_id, descricao_problema, latitude_origem, longitude_origem, status)
       VALUES (?, ?, ?, ?, ?, 'PENDENTE')`,
      [cliente_id, categoria_id, descricao_problema ?? null, lat, lng]
    );

    const [criada] = await db.query(
      `SELECT s.id, s.status, s.descricao_problema, s.latitude_origem, s.longitude_origem,
              s.criado_em, c.nome AS categoria_nome
         FROM solicitacoes s
         JOIN categorias_servico c ON c.id = s.categoria_id
        WHERE s.id = ?`,
      [resultado.insertId]
    );

    return res.status(201).json(criada[0]);
  } catch (erro) {
    if (erro.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ erro: "Cliente ou categoria inexistente." });
    }
    console.error(erro);
    return res.status(500).json({ erro: "Nao foi possivel registrar a solicitacao." });
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