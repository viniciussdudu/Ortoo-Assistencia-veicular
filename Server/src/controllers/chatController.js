const db = require('../config/db');

function createChatController(database) {
  const selectConversation = `SELECT s.id, s.cliente_id, s.prestador_id, s.status,
    p.usuario_id AS prestador_usuario_id, c.nome AS cliente_nome,
    COALESCE(p.nome_fantasia, u.nome) AS prestador_nome
    FROM solicitacoes s
    JOIN usuarios c ON c.id = s.cliente_id
    LEFT JOIN perfis_prestadores p ON p.id = s.prestador_id
    LEFT JOIN usuarios u ON u.id = p.usuario_id`;

  async function conversation(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'Atendimento inválido.' });
      return null;
    }
    const [rows] = await database.execute(`${selectConversation} WHERE s.id = ?`, [id]);
    const item = rows[0];
    if (!item || (item.cliente_id !== req.userId && item.prestador_usuario_id !== req.userId)) {
      res.status(403).json({ erro: 'Você não participa desta conversa.' });
      return null;
    }
    return item;
  }

  async function listar(req, res, next) {
    try {
      const [rows] = await database.execute(`${selectConversation}
        WHERE s.prestador_id IS NOT NULL AND (s.cliente_id = ? OR p.usuario_id = ?)
        ORDER BY s.criado_em DESC, s.id DESC`, [req.userId, req.userId]);
      res.json(rows.map(row => ({ ...row, meu_id: req.userId })));
    } catch (error) { next(error); }
  }

  async function iniciar(req, res, next) {
    try {
      const item = await conversation(req, res);
      if (!item) return;
      if (item.cliente_id !== req.userId) return res.status(403).json({ erro: 'Somente o cliente pode escolher o prestador.' });
      const providerId = Number(req.body.prestador_id);
      if (!Number.isSafeInteger(providerId) || providerId <= 0) return res.status(400).json({ erro: 'Escolha um prestador válido.' });
      if (item.prestador_id) {
        if (item.prestador_id !== providerId) return res.status(409).json({ erro: 'Este atendimento já tem outro prestador.' });
        return res.json({ id: item.id });
      }
      if (item.status !== 'PENDENTE') return res.status(409).json({ erro: 'Este atendimento não está disponível para iniciar uma conversa.' });
      const [providers] = await database.execute(
        `SELECT p.id FROM perfis_prestadores p WHERE p.id = ? AND p.disponivel = TRUE
         AND EXISTS (SELECT 1 FROM servicos_prestador sp JOIN solicitacoes s ON s.categoria_id = sp.categoria_id WHERE sp.prestador_id = p.id AND s.id = ?)`,
        [providerId, item.id],
      );
      if (!providers.length) return res.status(400).json({ erro: 'Prestador indisponível para este serviço.' });
      const [result] = await database.execute(
        "UPDATE solicitacoes SET prestador_id = ? WHERE id = ? AND cliente_id = ? AND prestador_id IS NULL AND status = 'PENDENTE'",
        [providerId, item.id, req.userId],
      );
      if (!result.affectedRows) return res.status(409).json({ erro: 'Atendimento alterado. Atualize a tela e tente novamente.' });
      res.json({ id: item.id });
    } catch (error) { next(error); }
  }

  async function mensagens(req, res, next) {
    try {
      const item = await conversation(req, res);
      if (!item) return;
      if (!item.prestador_id) return res.status(409).json({ erro: 'Escolha um prestador para iniciar a conversa.' });
      const [messages] = await database.execute(
        'SELECT id, remetente_id, conteudo, criado_em FROM mensagens_chat WHERE solicitacao_id = ? ORDER BY criado_em, id', [item.id],
      );
      res.json({ ...item, meu_id: req.userId, mensagens: messages });
    } catch (error) { next(error); }
  }

  async function enviar(req, res, next) {
    const text = typeof req.body.conteudo === 'string' ? req.body.conteudo.trim() : '';
    if (!text || text.length > 2000) return res.status(400).json({ erro: 'Escreva uma mensagem com até 2000 caracteres.' });
    try {
      const item = await conversation(req, res);
      if (!item) return;
      if (!item.prestador_id) return res.status(409).json({ erro: 'Escolha um prestador para iniciar a conversa.' });
      if (['CANCELADO', 'CONCLUIDO'].includes(item.status)) return res.status(409).json({ erro: 'Atendimento encerrado. O histórico está disponível para leitura.' });
      const [result] = await database.execute(
        'INSERT INTO mensagens_chat (solicitacao_id, remetente_id, conteudo) VALUES (?, ?, ?)', [item.id, req.userId, text],
      );
      res.status(201).json({ id: result.insertId });
    } catch (error) { next(error); }
  }

  return { listar, iniciar, mensagens, enviar };
}

module.exports = { ...createChatController(db), createChatController };
