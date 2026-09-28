const bcrypt = require("bcryptjs");
const db = require("../config/db");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidCpf(cpf) {
  // Verifica formato de 11 dígitos e bloqueia sequências repetidas (ex: 11111111111)
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (base, factor) => {
    const sum = base
      .split("")
      .reduce((total, digit) => total + Number(digit) * factor--, 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateDigit(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
    calculateDigit(cpf.slice(0, 10), 11) === Number(cpf[10])
  );
}

function isValidCnpj(cnpj) {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (sliceLength) => {
    let factor = sliceLength - 7;
    let sum = 0;
    for (let i = 0; i < sliceLength; i++) {
      sum += Number(cnpj[i]) * factor--;
      if (factor < 2) factor = 9;
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

function validateRegistration(body) {
  const nome = body?.nome?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  const cleanDoc = body?.documento?.replace(/\D/g, "");
  const telefone = body?.telefone?.trim() || "";
  const tipo_usuario = body?.tipo_usuario || "CLIENTE";

  if (!nome || !email || !password || !cleanDoc) {
    return { error: "Nome, e-mail, documento e senha são obrigatórios." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Informe um e-mail válido." };
  }

  if (!/^\d{6}$/.test(password)) {
    return { error: "A senha deve ter exatamente 6 dígitos numéricos." };
  }

  if (!["CLIENTE", "PRESTADOR_AUTONOMO", "EMPRESA"].includes(tipo_usuario)) {
    return { error: "Tipo de usuário inválido." };
  }

  const isCnpj = cleanDoc.length === 14;
  const isCpf = cleanDoc.length === 11;

  if (tipo_usuario === "EMPRESA" && !isCnpj) {
    return { error: "Empresas devem cadastrar um CNPJ com 14 dígitos." };
  }

  if (isCpf && !isValidCpf(cleanDoc)) {
    return { error: "Informe um CPF válido." };
  }

  if (isCnpj && !isValidCnpj(cleanDoc)) {
    return { error: "Informe um CNPJ válido." };
  }

  if (tipo_usuario !== "CLIENTE") {
    if (!body?.nome_fantasia?.trim()) {
      return { error: "Nome fantasia / razão social é obrigatório para mecânicos e empresas." };
    }
  }

  return {
    nome,
    email,
    password,
    documento: cleanDoc,
    tipoDocumento: isCnpj ? "CNPJ" : "CPF",
    tipo_usuario,
    telefone,
    nome_fantasia: body?.nome_fantasia?.trim() || null,
    descricao_empresa: body?.descricao_empresa?.trim() || null,
    raio_atendimento_km: Number(body?.raio_atendimento_km) || 15,
    latitude_atual: body?.latitude_atual ? Number(body.latitude_atual) : null,
    longitude_atual: body?.longitude_atual ? Number(body.longitude_atual) : null,
  };
}

async function register(req, res, next) {
  const data = validateRegistration(req.body);
  if (data.error) {
    return res.status(400).json({ erro: data.error });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const senhaHash = await bcrypt.hash(data.password, 12);

    const [userResult] = await connection.execute(
      `INSERT INTO usuarios (nome, email, documento, senha, telefone, tipo_documento, tipo_usuario)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                                  [
                                                    data.nome,
                                                  data.email,
                                                  data.documento,
                                                  senhaHash,
                                                  data.telefone,
                                                  data.tipoDocumento,
                                                  data.tipo_usuario,
                                                  ]
    );

    const novoUsuarioId = userResult.insertId;

    if (data.tipo_usuario !== "CLIENTE") {
      await connection.execute(
        `INSERT INTO perfis_prestadores
        (usuario_id, nome_fantasia, raio_atendimento_km, descricao_empresa, latitude_atual, longitude_atual, disponivel)
        VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
                               [
                                 novoUsuarioId,
                               data.nome_fantasia,
                               data.raio_atendimento_km,
                               data.descricao_empresa,
                               data.latitude_atual,
                               data.longitude_atual,
                               ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      id: novoUsuarioId,
      nome: data.nome,
      email: data.email,
      tipo_usuario: data.tipo_usuario,
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return res
      .status(409)
      .json({ erro: "Já existe uma conta com este e-mail ou documento." });
    }

    return next(error);
  } finally {
    connection.release();
  }
}

async function login(req, res, next) {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!email || !password) {
    return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
  }

  try {
    const [rows] = await db.execute(
      "SELECT id, nome, email, senha, tipo_usuario FROM usuarios WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.senha))) {
      return res.status(401).json({ erro: "Senha ou e-mail inválido." });
    }

    return res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res) {
  return res
  .status(200)
  .json({ sucesso: true, mensagem: "Sessão encerrada com sucesso." });
}

async function recuperarSenha(req, res, next) {
  const email = req.body?.email?.trim().toLowerCase();
  const novaSenha = req.body?.novaSenha;

  if (!email || !novaSenha) {
    return res.status(400).json({ erro: "E-mail e nova senha são obrigatórios." });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ erro: "Informe um e-mail válido." });
  }

  if (!/^\d{6}$/.test(novaSenha)) {
    return res.status(400).json({ erro: "A nova senha deve ter exatamente 6 dígitos numéricos." });
  }

  try {
    const [rows] = await db.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ erro: "Nenhuma conta cadastrada com este e-mail." });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);
    await db.execute("UPDATE usuarios SET senha = ? WHERE email = ?", [senhaHash, email]);

    return res.status(200).json({ sucesso: true, mensagem: "Senha redefinida com sucesso." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  recuperarSenha,
};
