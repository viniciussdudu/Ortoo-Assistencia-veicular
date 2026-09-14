const bcrypt = require("bcryptjs");
const db = require("../config/db");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidCpf(cpf) {
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

function validateRegistration(body) {
  const nome = body?.nome?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  const documento = body?.documento?.replace(/\D/g, "");

  if (!nome || !email || !password || !documento) {
    return { error: "Nome, e-mail, CPF e senha são obrigatórios." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Informe um e-mail válido." };
  }

  if (!/^\d{6}$/.test(password)) {
    return { error: "A senha deve ter exatamente 6 dígitos numéricos." };
  }

  if (!isValidCpf(documento)) {
    return { error: "Informe um CPF válido." };
  }

  return { nome, email, password, documento };
}

async function register(req, res, next) {
  const data = validateRegistration(req.body);
  if (data.error) {
    return res.status(400).json({ erro: data.error });
  }

  try {
    const senha = await bcrypt.hash(data.password, 12);

    // Trata documento (apenas números) e define CPF ou CNPJ pelo tamanho
    const cleanDoc = data.documento.replace(/\D/g, "");
    const tipoDocumento = cleanDoc.length === 14 ? "CNPJ" : "CPF";

    // SQL ajustado de acordo com a estrutura real da tabela 'usuarios'
    const [result] = await db.execute(
      `INSERT INTO usuarios (nome, email, documento, senha, telefone, tipo_documento, tipo_usuario)
       VALUES (?, ?, ?, ?, ?, ?, 'CLIENTE')`,
      [
        data.nome,
        data.email,
        cleanDoc,
        senha,
        data.telefone || "",
        tipoDocumento,
      ]
    );

    return res.status(201).json({
      id: result.insertId,
      nome: data.nome,
      email: data.email,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ erro: "Já existe uma conta com este e-mail ou CPF." });
    }

    return next(error);
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
      "SELECT id, nome, email, senha FROM usuarios WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.senha))) {
      return res.status(401).json({ erro: "Senha inválida." });
    }

    return res.json({ id: user.id, nome: user.nome, email: user.email });
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