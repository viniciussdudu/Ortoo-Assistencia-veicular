const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const db = require("../config/db");

const pastaFotos = path.resolve(__dirname, "../../uploads/perfis");
const prefixoFoto = "/usuario/fotos/";
const limite = 5 * 1024 * 1024;
const nomeSeguro = /^\d+-[0-9a-f-]{36}\.(jpg|png|webp)$/;

function extensaoImagem(bytes) {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "png";
  if (bytes.length >= 16 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

async function excluirFoto(url, usuarioId) {
  if (!url?.startsWith(prefixoFoto)) return;
  const nome = url.slice(prefixoFoto.length);
  if (nome.startsWith(`${usuarioId}-`) && nomeSeguro.test(nome)) await fs.rm(path.join(pastaFotos, nome), { force: true });
}

async function salvarFoto(req, res, next) {
  const base64 = req.body;
  if (typeof base64 !== "string" || !base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return res.status(400).json({ erro: "Selecione uma imagem válida." });
  }
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > limite) return res.status(413).json({ erro: "A foto deve ter até 5 MB." });
  const extensao = extensaoImagem(bytes);
  if (!extensao) return res.status(415).json({ erro: "Escolha uma imagem JPG, PNG ou WebP." });

  const nome = `${req.userId}-${randomUUID()}.${extensao}`;
  const foto_url = `${prefixoFoto}${nome}`;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[usuario]] = await connection.execute("SELECT foto_url FROM usuarios WHERE id = ? FOR UPDATE", [req.userId]);
    if (!usuario) {
      await connection.rollback();
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    await fs.mkdir(pastaFotos, { recursive: true });
    await fs.writeFile(path.join(pastaFotos, nome), bytes, { flag: "wx" });
    await connection.execute("UPDATE usuarios SET foto_url = ? WHERE id = ?", [foto_url, req.userId]);
    await connection.commit();
    await excluirFoto(usuario.foto_url, req.userId).catch(console.error);
    return res.json({ foto_url });
  } catch (error) {
    if (connection) await connection.rollback().catch(console.error);
    await excluirFoto(foto_url, req.userId).catch(console.error);
    return next(error);
  } finally {
    connection?.release();
  }
}

module.exports = { pastaFotos, salvarFoto };
