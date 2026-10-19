const db = require("../config/db");

const CAMPOS_OBRIGATORIOS = ["cliente_id", "categoria_id", "latitude_origem", "longitude_origem"];

// 1. Listar categorias para o app
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

// 2. Criar nova solicitação (com limpeza de solicitações 'PENDENTE' antigas)
async function criarSolicitacao(req, res) {
  const { cliente_id, categoria_id, latitude_origem, longitude_origem, descricao_problema } = req.body;

  // Validação de campos obrigatórios
  const faltando = CAMPOS_OBRIGATORIOS.filter(
    (campo) => req.body[campo] === undefined || req.body[campo] === null
  );
  if (faltando.length > 0) {
    return res.status(400).json({ erro: `Campos obrigatorios ausentes: ${faltando.join(", ")}.` });
  }

  // Validação de coordenadas GPS
  const lat = Number(latitude_origem);
  const lng = Number(longitude_origem);
  if (Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lng) || lng < -180 || lng > 180) {
    return res.status(400).json({ erro: "Coordenadas invalidas." });
  }

  try {
    // Cancela automaticamente qualquer solicitação 'PENDENTE' anterior que ficou aberta por engano
    await db.query(
      `UPDATE solicitacoes 
       SET status = 'CANCELADO' 
       WHERE cliente_id = ? AND status = 'PENDENTE'`,
      [cliente_id]
    );

    // Insere a nova solicitação
    const [resultado] = await db.query(
      `INSERT INTO solicitacoes
        (cliente_id, categoria_id, descricao_problema, latitude_origem, longitude_origem, status)
       VALUES (?, ?, ?, ?, ?, 'PENDENTE')`,
      [cliente_id, categoria_id, descricao_problema ?? null, lat, lng]
    );

    // Retorna a solicitação criada já com o nome da categoria vinculada
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
    console.error("Erro ao criar solicitacao:", erro);
    return res.status(500).json({ erro: "Nao foi possivel registrar a solicitacao." });
  }
}

// 3. Listar histórico de solicitações do cliente
async function listarSolicitacoesCliente(req, res) {
  const clienteId = Number(req.query.cliente_id);
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
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
      [clienteId]
    );
    return res.json(rows);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Nao foi possivel carregar as solicitacoes." });
  }
}

// 4. Cancelar uma solicitação específica
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

// =========================================================================
// FUNÇÕES DA FEATURE DE ACOMPANHAMENTO DE STATUS & VISÃO DO MECÂNICO
// =========================================================================

// 5. Listar solicitações pendentes (para a tela/mapa do mecânico)
async function listarPendentes(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
        s.id,
        s.cliente_id,
        s.categoria_id,
        s.latitude_origem,
        s.longitude_origem,
        s.descricao_problema,
        s.status,
        s.criado_em,
        u.nome AS cliente_nome,
        u.telefone AS cliente_telefone,
        c.nome AS categoria_nome
       FROM solicitacoes s
       JOIN usuarios u ON s.cliente_id = u.id
       LEFT JOIN categorias_servico c ON s.categoria_id = c.id
       WHERE s.status = 'PENDENTE'
       ORDER BY s.criado_em DESC`
    );

    return res.json(rows);
  } catch (erro) {
    console.error("Erro ao buscar chamadas pendentes:", erro);
    return res.status(500).json({ erro: "Nao foi possivel carregar as chamadas pendentes." });
  }
}

// 6. Buscar detalhes de uma solicitação por ID (para a tela de acompanhamento/polling)
async function buscarPorId(req, res) {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT
        s.*,
        u.nome AS cliente_nome,
        u.telefone AS cliente_telefone,
        c.nome AS categoria_nome,
        p.nome AS prestador_nome
       FROM solicitacoes s
       JOIN usuarios u ON s.cliente_id = u.id
       LEFT JOIN categorias_servico c ON s.categoria_id = c.id
       LEFT JOIN usuarios p ON s.prestador_id = p.id
       WHERE s.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Solicitacao nao encontrada." });
    }

    return res.json(rows[0]);
  } catch (erro) {
    console.error("Erro ao buscar solicitacao por ID:", erro);
    return res.status(500).json({ erro: "Nao foi possivel buscar a solicitacao." });
  }
}

// 7. Atualizar a etapa/status da solicitação (PENDENTE, ACEITO, A_CAMINHO, EM_ANDAMENTO, CONCLUIDO)
async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status, prestador_id } = req.body;

  if (!status) {
    return res.status(400).json({ erro: "Informe o novo status." });
  }

  try {
    if (prestador_id) {
      await db.query(
        "UPDATE solicitacoes SET status = ?, prestador_id = ? WHERE id = ?",
        [status, prestador_id, id]
      );
    } else {
      await db.query("UPDATE solicitacoes SET status = ? WHERE id = ?", [status, id]);
    }

    return res.json({ sucesso: true, status });
  } catch (erro) {
    console.error("Erro ao atualizar status:", erro);
    return res.status(500).json({ erro: "Nao foi possivel atualizar o status." });
  }
}

// Exportação completa de todos os métodos
module.exports = {
  listarCategorias,
  criarSolicitacao,
  listarSolicitacoesCliente,
  cancelarSolicitacao,
  listarPendentes,
  buscarPorId,
  atualizarStatus,
};
