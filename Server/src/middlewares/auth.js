const jwt = require("jsonwebtoken");
const { secret } = require("../config/jwt");

// Valida o header "Authorization: Bearer <token>" e preenche req.userId
// a partir do token assinado. Nunca lê o id de body, query ou params.
function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("Subject inválido");
    }

    req.userId = userId;
    return next();
  } catch (error) {
    const expirou = error.name === "TokenExpiredError";
    return res.status(401).json({
      erro: expirou
        ? "Sessão expirada. Entre novamente."
        : "Credencial inválida.",
    });
  }
}

module.exports = { requireAuth };