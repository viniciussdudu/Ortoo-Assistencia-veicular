require("dotenv").config();

const secret = process.env.JWT_SECRET;

// Falha na inicialização se o segredo não existir: evita subir a API
// emitindo tokens assináveis por qualquer um.
if (!secret || secret.length < 32) {
  throw new Error(
    "JWT_SECRET ausente ou curto demais (mínimo 32 caracteres). Configure no .env."
  );
}

module.exports = {
  secret,
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
};