const db = require("../config/db");

async function getProfile(req, res, next) {
  try {
    const usuarioId = req.userId || 1;

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

    const [historico] = await db
      .execute(
        "SELECT id, data, problema, status FROM atendimentos WHERE usuario_id = ?",
        [usuarioId],
      )
      .catch(() => [[]]); // Fallback caso a tabela ainda não exista

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
