const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createChatController } = require('../src/controllers/chatController');

function response() {
  return { code: 200, payload: null, status(code) { this.code = code; return this; }, json(payload) { this.payload = payload; return this; } };
}
const item = { id: 7, cliente_id: 11, prestador_id: 3, prestador_usuario_id: 22, status: 'PENDENTE' };

test('chat nega leitura para quem não participa do atendimento', async () => {
  let calls = 0;
  const controller = createChatController({ execute: async () => { calls++; return [[item]]; } });
  const res = response();
  await controller.mensagens({ params: { id: '7' }, userId: 99 }, res, assert.fail);
  assert.equal(res.code, 403);
  assert.equal(calls, 1);
});

test('mensagens identificam o prestador pelo usuario_id, não pelo id do perfil', async () => {
  const controller = createChatController({ execute: async (sql) => sql.includes('FROM solicitacoes') ? [[item]] : [[{ id: 1, conteudo: 'Olá' }]] });
  const res = response();
  await controller.mensagens({ params: { id: '7' }, userId: 22 }, res, assert.fail);
  assert.equal(res.code, 200);
  assert.equal(res.payload.meu_id, 22);
  assert.equal(res.payload.mensagens.length, 1);
});

test('envio usa o remetente autenticado e não aceita identidade no corpo', async () => {
  let inserted;
  const controller = createChatController({ execute: async (sql, values) => {
    if (sql.startsWith('INSERT')) { inserted = values; return [{ insertId: 91 }]; }
    return [[item]];
  } });
  const res = response();
  await controller.enviar({ params: { id: '7' }, userId: 11, body: { remetente_id: 22, conteudo: '  Olá  ' } }, res, assert.fail);
  assert.equal(res.code, 201);
  assert.deepEqual(inserted, [7, 11, 'Olá']);
});

test('chat encerrado preserva histórico e bloqueia novos envios', async () => {
  const controller = createChatController({ execute: async () => [[{ ...item, status: 'CANCELADO' }]] });
  const res = response();
  await controller.enviar({ params: { id: '7' }, userId: 11, body: { conteudo: 'Olá' } }, res, assert.fail);
  assert.equal(res.code, 409);
});

test('chat rejeita mensagem vazia ou longa antes de consultar o banco', async () => {
  const controller = createChatController({ execute: assert.fail });
  for (const conteudo of ['   ', 'a'.repeat(2001), 123]) {
    const res = response();
    await controller.enviar({ params: { id: '7' }, userId: 11, body: { conteudo } }, res, assert.fail);
    assert.equal(res.code, 400);
  }
});

test('cliente não pode trocar o prestador de uma conversa existente', async () => {
  const controller = createChatController({ execute: async () => [[item]] });
  const res = response();
  await controller.iniciar({ params: { id: '7' }, userId: 11, body: { prestador_id: 4 } }, res, assert.fail);
  assert.equal(res.code, 409);
});
