const db = require("../config/db");

async function getProfile(req, res, next) {
  try {
    const usuarioId = req.userId || 1;

    const [usuarios] = await db.execute(
      "SELECT id, nome, email, telefone, tipo_usuario FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const [veiculos] = await db
      .execute(
        "SELECT modelo, placa, cor FROM veiculos WHERE usuario_id = ? LIMIT 1",
        [usuarioId]
      )
      .catch(() => [[]]);

    const [historico] = await db
      .execute(
        "SELECT id, criado_em AS data, descricao_problema AS problema, status FROM solicitacoes WHERE cliente_id = ?",
        [usuarioId]
      )
      .catch(() => [[]]);

    const usuario = usuarios[0];

    return res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      tipo_usuario: usuario.tipo_usuario,
      veiculo: veiculos[0] || null,
      historico: historico || [],
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProfile };