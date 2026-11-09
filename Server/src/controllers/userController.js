const db = require("../config/db");
const bcrypt = require("bcryptjs");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getProfile(req, res, next) {
  try {
    const usuarioId = req.userId;

    if (!usuarioId) {
      return res.status(401).json({ erro: "Usuário não autenticado." });
    }


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
  const usuarioId = req.userId;
  if (!usuarioId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }
  const {
    nome: nomeInput,
    email: emailInput,
    telefone: telefoneInput,
    senha_atual,
    foto_url,
    nome_fantasia,
    descricao_empresa,
    raio_atendimento_km,
    disponivel,
  } = req.body ?? {};

  const nome = typeof nomeInput === "string" ? nomeInput.trim() : "";
  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  const telefone = typeof telefoneInput === "string" ? telefoneInput.trim() : "";
  const digitosTelefone = telefone.replace(/\D/g, "");
  if (!nome || nome.length > 100) {
    return res.status(400).json({ erro: "Informe um nome com até 100 caracteres." });
  }
  if (email.length > 100 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ erro: "Informe um e-mail válido com até 100 caracteres." });
  }
  if (telefone.length > 20 || !/^\+?[\d ().-]+$/.test(telefone) || !/^\d{10,15}$/.test(digitosTelefone)) {
    return res.status(400).json({ erro: "Informe um telefone válido com DDD." });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [usuarios] = await connection.execute(
      "SELECT tipo_usuario, email, senha FROM usuarios WHERE id = ? FOR UPDATE",
      [usuarioId]
    );
    const usuario = usuarios[0];
    if (!usuario) {
      await connection.rollback();
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    if (email !== usuario.email.toLowerCase() &&
        (typeof senha_atual !== "string" || !/^\d{6}$/.test(senha_atual) || !(await bcrypt.compare(senha_atual, usuario.senha)))) {
      await connection.rollback();
      return res.status(403).json({ erro: "Informe a senha atual correta para alterar o e-mail." });
    }

    await connection.execute(
      "UPDATE usuarios SET nome = ?, email = ?, telefone = ?, foto_url = COALESCE(?, foto_url) WHERE id = ?",
      [nome, email, telefone, foto_url || null, usuarioId]
    );

    if (usuario.tipo_usuario !== "CLIENTE") {
      await connection.execute(
        `UPDATE perfis_prestadores
        SET nome_fantasia = COALESCE(?, nome_fantasia),
                               descricao_empresa = COALESCE(?, descricao_empresa),
                               raio_atendimento_km = COALESCE(?, raio_atendimento_km),
                               disponivel = COALESCE(?, disponivel)
                               WHERE usuario_id = ?`,
                               [
                                 nome_fantasia ? nome_fantasia.trim() : null,
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
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        return next(rollbackError);
      }
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ erro: "Este e-mail já está em uso por outra conta." });
    }
    return next(error);
  } finally {
    connection?.release();
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
