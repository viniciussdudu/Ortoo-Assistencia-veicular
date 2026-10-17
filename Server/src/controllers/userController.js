const db = require("../config/db");

async function getProfile(req, res, next) {
  try {
    const usuarioId = req.query.usuario_id || req.userId || 1;

    const [usuarios] = await db.execute(
      "SELECT id, nome, email, telefone, documento, tipo_documento, tipo_usuario, foto_url FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const usuario = usuarios[0];

    // Busca dados do prestador caso seja mecânico/empresa
    let dadosPrestador = null;
    if (usuario.tipo_usuario !== "CLIENTE") {
      const [prestadores] = await db.execute(
        "SELECT id, nome_fantasia, descricao_empresa, raio_atendimento_km, disponivel, latitude_atual, longitude_atual FROM perfis_prestadores WHERE usuario_id = ? LIMIT 1",
        [usuarioId]
      );
      dadosPrestador = prestadores[0] || null;
    }

    const [veiculos] = await db
    .execute(
      "SELECT modelo, placa, cor FROM veiculos WHERE usuario_id = ? LIMIT 1",
      [usuarioId]
    )
    .catch(() => [[]]);

    const [historico] = await db
    .execute(
      "SELECT id, criado_em AS data, descricao_problema AS problema, status FROM solicitacoes WHERE cliente_id = ? ORDER BY criado_em DESC",
      [usuarioId]
    )
    .catch(() => [[]]);

    return res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      documento: usuario.documento,
      tipo_documento: usuario.tipo_documento,
      tipo_usuario: usuario.tipo_usuario,
      foto_url: usuario.foto_url,
      prestador: dadosPrestador,
      veiculo: veiculos[0] || null,
      historico: historico || [],
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  const usuarioId = req.body.usuario_id || req.userId || 1;
  const {
    nome,
    telefone,
    foto_url,
    nome_fantasia,
    descricao_empresa,
    raio_atendimento_km,
    disponivel,
  } = req.body;

  if (!nome || !telefone) {
    return res.status(400).json({ erro: "Nome e telefone são obrigatórios." });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Atualiza dados comuns na tabela usuarios
    await connection.execute(
      "UPDATE usuarios SET nome = ?, telefone = ?, foto_url = COALESCE(?, foto_url) WHERE id = ?",
                             [nome.trim(), telefone.trim(), foto_url || null, usuarioId]
    );

    // 2. Se for perfil de prestador, atualiza também a tabela perfis_prestadores
    const [usuarios] = await connection.execute(
      "SELECT tipo_usuario FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    if (usuarios.length > 0 && usuarios[0].tipo_usuario !== "CLIENTE") {
      await connection.execute(
        `UPDATE perfis_prestadores
        SET nome_fantasia = COALESCE(?, nome_fantasia),
                               descricao_empresa = COALESCE(?, descricao_empresa),
                               raio_atendimento_km = COALESCE(?, raio_atendimento_km),
                               disponivel = COALESCE(?, disponivel)
                               WHERE usuario_id = ?`,
                               [
                                 nome_fantasia ? nomeFantasia.trim() : null,
                               descricao_empresa ? descricao_empresa.trim() : null,
                               raio_atendimento_km !== undefined ? Number(raio_atendimento_km) : null,
                               disponivel !== undefined ? Boolean(disponivel) : null,
                               usuarioId,
                               ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      sucesso: true,
      mensagem: "Perfil atualizado com sucesso!",
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
