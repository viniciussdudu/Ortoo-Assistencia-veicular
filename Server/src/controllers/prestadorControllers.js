const db = require("../config/db");

async function listarPrestadores(req, res) {
  const { disponivel } = req.query;

  try {
    let sql = `
      SELECT p.id AS prestador_id, p.usuario_id, u.nome, u.foto_url,
             p.nome_fantasia, p.descricao_empresa, p.disponivel,
             p.raio_atendimento_km, p.latitude_atual, p.longitude_atual
        FROM perfis_prestadores p
        JOIN usuarios u ON u.id = p.usuario_id
       WHERE u.tipo_usuario IN ('PRESTADOR_AUTONOMO', 'EMPRESA')
    `;
    const params = [];

    if (disponivel === "true" || disponivel === "false") {
      sql += " AND p.disponivel = ?";
      params.push(disponivel === "true");
    }

    sql += " ORDER BY u.nome";

    const [prestadores] = await db.query(sql, params);

    if (prestadores.length === 0) {
      return res.json([]);
    }

    const ids = prestadores.map((p) => p.prestador_id);
    const placeholders = ids.map(() => "?").join(", ");

    const [servicos] = await db.query(
      `SELECT sp.id, sp.prestador_id, sp.preco_base, c.id AS categoria_id, c.nome AS categoria_nome
         FROM servicos_prestador sp
         JOIN categorias_servico c ON c.id = sp.categoria_id
        WHERE sp.prestador_id IN (${placeholders})`,
      ids
    );

    const servicosPorPrestador = new Map();
    for (const servico of servicos) {
      const lista = servicosPorPrestador.get(servico.prestador_id) ?? [];
      lista.push({
        id: servico.id,
        categoria_id: servico.categoria_id,
        categoria_nome: servico.categoria_nome,
        preco_base: servico.preco_base,
      });
      servicosPorPrestador.set(servico.prestador_id, lista);
    }

    const resultado = prestadores.map((p) => ({
      id: p.prestador_id,
      usuario_id: p.usuario_id,
      nome: p.nome_fantasia || p.nome,
      nome_fantasia: p.nome_fantasia,
      foto_url: p.foto_url,
      descricao_empresa: p.descricao_empresa,
      disponivel: !!p.disponivel,
      raio_atendimento_km: p.raio_atendimento_km,
      servicos: servicosPorPrestador.get(p.prestador_id) ?? [],
    }));

    return res.json(resultado);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Nao foi possivel carregar os prestadores." });
  }
}

async function cadastrarServico(req, res) {
  const categoriaId = Number(req.body?.categoria_id);
  const preco = Number(req.body?.preco_base);

  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    return res.status(400).json({ erro: "Informe uma categoria válida." });
  }

  const centavosValidos =
    Number.isFinite(preco) && Math.abs(preco * 100 - Math.round(preco * 100)) < 1e-6;
  if (!centavosValidos || preco <= 0 || preco > 99999.99) {
    return res.status(400).json({
      erro: "Informe um preço maior que zero, até 99999.99, com no máximo 2 casas decimais.",
    });
  }

  try {
    // O prestador vem do usuário autenticado (req.userId, definido pelo token),
    // nunca de um id enviado pelo app.
    const [perfis] = await db.execute(
      "SELECT id FROM perfis_prestadores WHERE usuario_id = ? LIMIT 1",
      [req.userId]
    );
    if (perfis.length === 0) {
      return res
        .status(403)
        .json({ erro: "Sua conta não possui perfil de prestador." });
    }
    const prestadorId = perfis[0].id;

    const [categorias] = await db.execute(
      "SELECT id, nome FROM categorias_servico WHERE id = ?",
      [categoriaId]
    );
    if (categorias.length === 0) {
      return res.status(404).json({ erro: "Categoria não encontrada." });
    }

    const [existentes] = await db.execute(
      "SELECT id FROM servicos_prestador WHERE prestador_id = ? AND categoria_id = ? LIMIT 1",
      [prestadorId, categoriaId]
    );
    if (existentes.length > 0) {
      return res
        .status(409)
        .json({ erro: "Você já oferece um serviço nesta categoria." });
    }

    const [resultado] = await db.execute(
      "INSERT INTO servicos_prestador (prestador_id, categoria_id, preco_base) VALUES (?, ?, ?)",
      [prestadorId, categoriaId, preco]
    );

    return res.status(201).json({
      id: resultado.insertId,
      prestador_id: prestadorId,
      categoria_id: categoriaId,
      categoria_nome: categorias[0].nome,
      preco_base: preco,
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Não foi possível cadastrar o serviço." });
  }
}

module.exports = { listarPrestadores, cadastrarServico };