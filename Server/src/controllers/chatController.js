const db = require("../config/db");

async function obterSolicitacaoAutorizada(solicitacaoId, usuarioId) {
  const [solicitacoes] = await db.execute(
    `SELECT s.id, s.cliente_id, s.status,
            p.usuario_id AS prestador_usuario_id,
            COALESCE(p.nome_fantasia, prestador.nome) AS prestador_nome
       FROM solicitacoes s
       LEFT JOIN perfis_prestadores p ON p.id = s.prestador_id
       LEFT JOIN usuarios prestador ON prestador.id = p.usuario_id
      WHERE s.id = ?
      LIMIT 1`,
    [solicitacaoId]
  );

  const solicitacao = solicitacoes[0];
  if (!solicitacao) return { erro: "Solicitação não encontrada.", status: 404 };
  if (!solicitacao.prestador_usuario_id) {
    return { erro: "Esta solicitação ainda não possui um prestador para conversar.", status: 409 };
  }
  if (solicitacao.status === "CANCELADO") {
    return { erro: "Não é possível conversar em um atendimento cancelado.", status: 409 };
  }
  if (usuarioId !== solicitacao.cliente_id && usuarioId !== solicitacao.prestador_usuario_id) {
    return { erro: "Você não tem acesso a esta conversa.", status: 403 };
  }
  return { solicitacao };
}

async function listarMensagens(req, res, next) {
  const solicitacaoId = Number(req.params.id);
  if (!Number.isInteger(solicitacaoId) || solicitacaoId <= 0) {
    return res.status(400).json({ erro: "Solicitação inválida." });
  }

  try {
    const acesso = await obterSolicitacaoAutorizada(solicitacaoId, req.userId);
    if (acesso.erro) return res.status(acesso.status).json({ erro: acesso.erro });

    const [mensagens] = await db.execute(
      `SELECT m.id, m.remetente_id, m.conteudo, m.criado_em, u.nome AS remetente_nome
         FROM mensagens_chat m
         JOIN usuarios u ON u.id = m.remetente_id
        WHERE m.solicitacao_id = ?
        ORDER BY m.criado_em ASC, m.id ASC`,
      [solicitacaoId]
    );

    return res.json({
      solicitacao_id: solicitacaoId,
      prestador: { nome: acesso.solicitacao.prestador_nome },
      mensagens,
    });
  } catch (error) {
    return next(error);
  }
}

async function enviarMensagem(req, res, next) {
  const solicitacaoId = Number(req.params.id);
  const conteudo = req.body?.conteudo?.trim();
  if (!Number.isInteger(solicitacaoId) || solicitacaoId <= 0) {
    return res.status(400).json({ erro: "Solicitação inválida." });
  }
  if (!conteudo || conteudo.length > 1000) {
    return res.status(400).json({ erro: "A mensagem deve ter entre 1 e 1000 caracteres." });
  }

  try {
    const acesso = await obterSolicitacaoAutorizada(solicitacaoId, req.userId);
    if (acesso.erro) return res.status(acesso.status).json({ erro: acesso.erro });

    const [resultado] = await db.execute(
      "INSERT INTO mensagens_chat (solicitacao_id, remetente_id, conteudo) VALUES (?, ?, ?)",
      [solicitacaoId, req.userId, conteudo]
    );
    const [mensagens] = await db.execute(
      `SELECT m.id, m.remetente_id, m.conteudo, m.criado_em, u.nome AS remetente_nome
         FROM mensagens_chat m JOIN usuarios u ON u.id = m.remetente_id WHERE m.id = ?`,
      [resultado.insertId]
    );
    return res.status(201).json(mensagens[0]);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listarMensagens, enviarMensagem };
