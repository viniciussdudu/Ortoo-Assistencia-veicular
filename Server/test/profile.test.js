const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const db = require("../src/config/db");
const { updateProfile } = require("../src/controllers/userController");

const dados = { nome: "  Pessoa Teste  ", email: "conta@example.test", telefone: "(63) 99999-9999" };

async function atualizar(t, body, { tipo = "CLIENTE", duplicado = false, userId = 42 } = {}) {
  const operacoes = [];
  const senha = await bcrypt.hash("123456", 4);
  t.mock.method(db, "getConnection", async () => ({
    async beginTransaction() { operacoes.push("início"); },
    async execute(sql, params) {
      operacoes.push({ sql, params });
      if (sql.startsWith("SELECT")) return [[{ tipo_usuario: tipo, email: dados.email, senha }]];
      if (duplicado) throw Object.assign(new Error("e-mail duplicado"), { code: "ER_DUP_ENTRY" });
      return [{ affectedRows: 1 }];
    },
    async commit() { operacoes.push("commit"); },
    async rollback() { operacoes.push("rollback"); },
    release() { operacoes.push("release"); },
  }));
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json() {} };
  await updateProfile({ userId, body }, res, assert.fail);
  return { status: res.statusCode, operacoes };
}

test("cliente atualiza contato sem senha e o corpo não pode escolher outra conta", async (t) => {
  const { status, operacoes } = await atualizar(t, { ...dados, usuario_id: 999, documento: "ignorar" });
  assert.equal(status, 200);
  const escritas = operacoes.filter(op => op.sql?.startsWith("UPDATE"));
  assert.equal(escritas.length, 1);
  assert.deepEqual(escritas[0].params, ["Pessoa Teste", dados.email, dados.telefone, null, 42]);
  assert.match(escritas[0].sql, /WHERE id = \?$/);
  assert.ok(!escritas[0].sql.includes("documento"));
  assert.deepEqual(operacoes.slice(-2), ["commit", "release"]);
});

test("mecânico altera e-mail com a senha atual e mantém a edição dos dados profissionais", async (t) => {
  const { status, operacoes } = await atualizar(t, {
    ...dados, email: "  NOVO@example.test ", senha_atual: "123456", nome_fantasia: "Oficina Teste",
  }, { tipo: "PRESTADOR_AUTONOMO" });
  assert.equal(status, 200);
  assert.equal(operacoes.find(op => op.sql?.startsWith("UPDATE usuarios")).params[1], "novo@example.test");
  assert.equal(operacoes.find(op => op.sql?.startsWith("UPDATE perfis_prestadores")).params[0], "Oficina Teste");
});

test("senha incorreta impede trocar o e-mail sem alterar os demais dados", async (t) => {
  const { status, operacoes } = await atualizar(t, { ...dados, email: "novo@example.test", senha_atual: "654321" });
  assert.equal(status, 403);
  assert.ok(!operacoes.some(op => op.sql?.startsWith("UPDATE")));
  assert.deepEqual(operacoes.slice(-2), ["rollback", "release"]);
});

test("e-mail já cadastrado retorna conflito e desfaz a edição", async (t) => {
  const { status, operacoes } = await atualizar(t, { ...dados, email: "novo@example.test", senha_atual: "123456" }, { duplicado: true });
  assert.equal(status, 409);
  assert.deepEqual(operacoes.slice(-2), ["rollback", "release"]);
});

test("telefone inválido é rejeitado antes de acessar o banco", async (t) => {
  const { status, operacoes } = await atualizar(t, { ...dados, telefone: "incompleto" });
  assert.equal(status, 400);
  assert.deepEqual(operacoes, []);
});
