const db = require("../config/db");

async function listarPrestadores(req, res) {
  const { disponivel } = req.query;

  try {
    let sql = `
      SELECT p.id AS prestador_id, u.nome, u.foto_url,
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
      nome: p.nome_fantasia || p.nome,
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

module.exports = { listarPrestadores };