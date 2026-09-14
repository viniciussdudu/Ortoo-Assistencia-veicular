const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const solicitacaoController = require("../controllers/solicitacaoController");

const router = express.Router();

router.post("/auth/cadastro", authController.register);
router.post("/auth/logout", authController.logout);
router.post("/auth/recuperar-senha", authController.recuperarSenha);

router.get("/usuario/perfil", userController.getProfile);

router.get("/categorias", solicitacaoController.listarCategorias);
router.post("/solicitacoes", solicitacaoController.criarSolicitacao);
router.get("/solicitacoes", solicitacaoController.listarSolicitacoesCliente);
router.patch("/solicitacoes/:id/cancelar", solicitacaoController.cancelarSolicitacao);

module.exports = router;