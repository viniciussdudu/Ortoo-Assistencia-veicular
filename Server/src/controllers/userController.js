const db = require("../config/db");

async function getProfile(req, res, next) {
  const usuarioId = Number(req.query.usuario_id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ erro: "Informe um usuario_id válido." });
  }

  try {
    const [usuarios] = await db.execute(
      "SELECT nome, email, telefone FROM usuarios WHERE id = ?",
      [usuarioId],
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const [veiculos] = await db
      .execute(
        "SELECT modelo, placa, cor FROM veiculos WHERE usuario_id = ? LIMIT 1",
        [usuarioId],
      )
      .catch(() => [[]]); // Fallback caso a tabela ainda não exista

    const [historico] = await db.execute(
      `SELECT s.id, s.descricao_problema AS problema, s.criado_em AS data, s.status
         FROM solicitacoes s
        WHERE s.cliente_id = ?
        ORDER BY s.criado_em DESC`,
      [usuarioId],
    );

    return res.status(200).json({
      usuario: usuarios[0],
      veiculo: veiculos[0] || null,
      historico: historico || [],
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProfile };
