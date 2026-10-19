const db = require("../config/db");

const TIPOS = ["CARRO", "MOTO", "BICICLETA", "BIKE_ELETRICA", "CAMINHAO"];

async function listarVeiculos(req, res, next) {
  const { usuario_id } = req.query;
  if (!usuario_id) {
    return res.status(400).json({ erro: "Informe o usuario_id." });
  }

  try {
    const [rows] = await db.execute(
      `SELECT id, tipo, marca, modelo, ano, placa, cor, km_atual, km_atualizado_em
         FROM veiculos WHERE usuario_id = ? ORDER BY criado_em DESC`,
      [usuario_id],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

async function obterVeiculo(req, res, next) {
  const { id } = req.params;

  try {
    const [veiculos] = await db.execute(
      `SELECT id, usuario_id, tipo, marca, modelo, ano, placa, cor, km_atual, km_atualizado_em, criado_em
         FROM veiculos WHERE id = ?`,
      [id],
    );
    if (veiculos.length === 0) {
      return res.status(404).json({ erro: "Veículo não encontrado." });
    }

    const [manutencoes] = await db.execute(
      `SELECT id, tipo, descricao, km_na_execucao, custo, executado_em
         FROM manutencoes_veiculo WHERE veiculo_id = ?
        ORDER BY executado_em DESC`,
      [id],
    );

    return res.json({ ...veiculos[0], manutencoes });
  } catch (error) {
    return next(error);
  }
}

async function criarVeiculo(req, res, next) {
  const { usuario_id, tipo, marca, modelo, ano, placa, cor, km_atual } = req.body;

  if (!usuario_id || !modelo) {
    return res.status(400).json({ erro: "usuario_id e modelo são obrigatórios." });
  }
  if (tipo && !TIPOS.includes(tipo)) {
    return res.status(400).json({ erro: "Tipo de veículo inválido." });
  }

  try {
    const [resultado] = await db.execute(
      `INSERT INTO veiculos (usuario_id, tipo, marca, modelo, ano, placa, cor, km_atual)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        tipo || "CARRO",
        marca ?? null,
        modelo,
        ano ?? null,
        placa ? placa.toUpperCase().replace(/[^A-Z0-9]/g, "") : null,
        cor ?? null,
        Number(km_atual) || 0,
      ],
    );

    const [criado] = await db.execute("SELECT * FROM veiculos WHERE id = ?", [
      resultado.insertId,
    ]);
    return res.status(201).json(criado[0]);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ erro: "Usuário inexistente." });
    }
    return next(error);
  }
}

async function atualizarQuilometragem(req, res, next) {
  const { id } = req.params;
  const km = Number(req.body?.km_atual);

  if (!Number.isFinite(km) || km < 0) {
    return res.status(400).json({ erro: "Quilometragem inválida." });
  }

  try {
    const [atual] = await db.execute(
      "SELECT km_atual FROM veiculos WHERE id = ?",
      [id],
    );
    if (atual.length === 0) {
      return res.status(404).json({ erro: "Veículo não encontrado." });
    }
    if (km < atual[0].km_atual) {
      return res.status(400).json({
        erro: `A quilometragem não pode diminuir (atual: ${atual[0].km_atual} km).`,
      });
    }

    await db.execute(
      "UPDATE veiculos SET km_atual = ?, km_atualizado_em = CURRENT_TIMESTAMP WHERE id = ?",
      [km, id],
    );
    return res.json({ sucesso: true, km_atual: km });
  } catch (error) {
    return next(error);
  }
}

async function registrarManutencao(req, res, next) {
  const { id } = req.params;
  const { tipo, descricao, km_na_execucao, custo, executado_em, solicitacao_id } =
    req.body;

  if (!tipo || !executado_em) {
    return res.status(400).json({ erro: "tipo e executado_em são obrigatórios." });
  }

  try {
    const [resultado] = await db.execute(
      `INSERT INTO manutencoes_veiculo
        (veiculo_id, solicitacao_id, tipo, descricao, km_na_execucao, custo, executado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        solicitacao_id ?? null,
        tipo,
        descricao ?? null,
        km_na_execucao ?? null,
        custo ?? null,
        executado_em,
      ],
    );

    const [criada] = await db.execute(
      "SELECT * FROM manutencoes_veiculo WHERE id = ?",
      [resultado.insertId],
    );
    return res.status(201).json(criada[0]);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ erro: "Veículo ou solicitação inexistente." });
    }
    return next(error);
  }
}

module.exports = {
  listarVeiculos,
  obterVeiculo,
  criarVeiculo,
  atualizarQuilometragem,
  registrarManutencao,
};