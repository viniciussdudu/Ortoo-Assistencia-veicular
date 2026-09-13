const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController"); // Supondo que você tenha ou vá criar esse controller

const router = express.Router();

router.post("/auth/cadastro", authController.register);
router.post("/auth/logout", authController.logout);

router.get("/usuario/perfil", userController.getProfile);

module.exports = router;
