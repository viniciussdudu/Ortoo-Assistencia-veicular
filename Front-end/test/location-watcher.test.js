const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadWatcher(navigator) {
  const source = fs.readFileSync(path.join(__dirname, "../src/services/location-watcher.web.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  // Sem Expo ou React Native no contexto: o watcher web deve ser independente.
  vm.runInNewContext(outputText, { exports, navigator });
  return exports.watchLocation;
}

test("sair do mapa libera o ID do navegador uma só vez e ignora eventos atrasados", async () => {
  let positionCallback;
  let errorCallback;
  const cleared = [];
  const positions = [];
  const errors = [];
  const watch = loadWatcher({ geolocation: {
    watchPosition(position, error) { positionCallback = position; errorCallback = error; return 47; },
    clearWatch(id) { cleared.push(id); },
  } });
  const subscription = await watch(position => positions.push(position), error => errors.push(error));
  positionCallback({ coords: { latitude: -10, longitude: -48 } });
  assert.equal(positions.length, 1);
  subscription.remove();
  subscription.remove();
  positionCallback({ coords: { latitude: 0, longitude: 0 } });
  errorCallback({ code: 2, message: "GPS indisponível" });
  assert.deepEqual(cleared, [47]);
  assert.equal(positions.length, 1);
  assert.equal(errors.length, 0);
});

test("permissão negada informa um erro sem quebrar a limpeza", async () => {
  let errorCallback;
  const messages = [];
  const watch = loadWatcher({ geolocation: {
    watchPosition(position, error) { errorCallback = error; return 12; },
    clearWatch() {},
  } });
  const subscription = await watch(() => {}, message => messages.push(message));
  errorCallback({ code: 1, message: "Permission denied" });
  assert.deepEqual(messages, ["Permissão de localização negada."]);
  assert.doesNotThrow(() => subscription.remove());
});

test("sem geolocalização retorna erro compreensível, inclusive na renderização estática", async () => {
  await assert.rejects(loadWatcher(undefined)(() => {}, () => {}), /Geolocalização indisponível/);
  await assert.rejects(loadWatcher({})(() => {}, () => {}), /Geolocalização indisponível/);
});
