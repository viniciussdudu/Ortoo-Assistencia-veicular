const express = require("express");
const db = require("../config/db"); // <--- Adicionado para funcionar na rota de status

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const solicitacaoController = require("../controllers/solicitacaoController");

const router = express.Router();

// Rota de Status da API
router.get("/status", async (req, res) => {
  try {
    await db.execute("SELECT 1");
    return res.json({ status: "API Online", bancoConectado: true });
  } catch (error) {
    return res.status(500).json({ 
      status: "API Online", 
      bancoConectado: false, 
      erro: error.message 
    });
  }
});

// Rotas de Autenticação
router.post("/auth/cadastro", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);
router.post("/auth/recuperar-senha", authController.recuperarSenha);

// Rotas de Usuário / Perfil
router.get("/usuario/perfil", userController.getProfile);

// Rotas de Solicitações e Categorias
router.get("/categorias", solicitacaoController.listarCategorias);
router.post("/solicitacoes", solicitacaoController.criarSolicitacao);
router.get("/solicitacoes", solicitacaoController.listarSolicitacoesCliente);
router.patch("/solicitacoes/:id/cancelar", solicitacaoController.cancelarSolicitacao);

// Rota para listar prestadores por categoria de serviço
router.get("/prestadores/categoria/:categoria_id", async (req, res) => {
  const { categoria_id } = req.params;

  try {
    const query = `
      SELECT 
        p.id AS prestador_id,
        u.nome,
        u.telefone,
        p.nome_fantasia,
        p.latitude_atual,
        p.longitude_atual,
        sp.preco_base
      FROM servicos_prestador sp
      INNER JOIN perfis_prestadores p ON sp.prestador_id = p.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      WHERE sp.categoria_id = ? 
        AND p.disponivel = TRUE;
    `;

    const [prestadores] = await db.query(query, [categoria_id]);
    return res.json(prestadores);
  } catch (error) {
    console.error("Erro ao buscar prestadores:", error);
    return res.status(500).json({ erro: "Erro interno ao buscar prestadores." });
  }
});

// Rota para cancelar solicitações pendentes do cliente
router.post("/solicitacoes/cancelar", async (req, res) => {
  const { cliente_id } = req.body;

  try {
    const query = `
      UPDATE solicitacoes 
      SET status = 'CANCELADO' 
      WHERE cliente_id = ? AND status IN ('PENDENTE', 'EM_ANDAMENTO');
    `;
    await db.query(query, [cliente_id]);
    
    return res.json({ mensagem: "Solicitação cancelada com sucesso." });
  } catch (error) {
    console.error("Erro ao cancelar solicitação:", error);
    return res.status(500).json({ erro: "Erro ao cancelar solicitação." });
  }
});

module.exports = router;