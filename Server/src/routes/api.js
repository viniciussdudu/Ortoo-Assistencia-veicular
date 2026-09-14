const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const solicitacaoController = require("../controllers/solicitacaoController");

const router = express.Router();


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



router.post("/auth/cadastro", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);
router.post("/auth/recuperar-senha", authController.recuperarSenha);

router.get("/usuario/perfil", userController.getProfile);

router.get("/categorias", solicitacaoController.listarCategorias);
router.post("/solicitacoes", solicitacaoController.criarSolicitacao);
router.get("/solicitacoes", solicitacaoController.listarSolicitacoesCliente);
router.patch("/solicitacoes/:id/cancelar", solicitacaoController.cancelarSolicitacao);

module.exports = router;