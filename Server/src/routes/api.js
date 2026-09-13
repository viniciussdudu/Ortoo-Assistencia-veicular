const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/auth/cadastro", authController.register);
router.post("/auth/logout", authController.logout);
router.post("/auth/recuperar-senha", authController.recuperarSenha);

router.get("/usuario/perfil", userController.getProfile);

module.exports = router;
