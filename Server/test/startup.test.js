const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('autenticação carrega sem chave Stripe configurada', () => {
  const result = spawnSync(process.execPath, ['-e', "require('./src/controllers/authController')"], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, JWT_SECRET: 'test-only-secret-with-at-least-32-characters', STRIPE_SECRET_KEY: '' },
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
});

test('cadastro encaminha falha de conexão ao tratamento de erros', async () => {
  process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
  const db = require('../src/config/db');
  const auth = require('../src/controllers/authController');
  const original = db.getConnection;
  const failure = new Error('banco indisponível');
  db.getConnection = async () => { throw failure; };
  try {
    let received;
    await auth.register({ body: {
      nome: 'Teste', email: 'test@example.com', password: '123456',
      documento: '52998224725', telefone: '63999990000',
    } }, {}, (error) => { received = error; });
    assert.equal(received, failure);
  } finally {
    db.getConnection = original;
    await db.end();
  }
});
