const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");

const root = path.resolve(__dirname, "..");
for (const folder of ["Server", "Front-end"]) {
  const target = path.join(root, folder, ".env");
  if (fs.existsSync(target)) {
    console.log(`${folder}/.env já existe; mantido.`);
    continue;
  }
  let content = fs.readFileSync(path.join(root, folder, ".env.example"), "utf8");
  if (folder === "Server") {
    content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString("hex")}`);
  }
  fs.writeFileSync(target, content, { flag: "wx" });
  console.log(`${folder}/.env criado.`);
}
console.log("Preencha DB_* em Server/.env, execute npm run install:all e npm run db:import. Inicie npm run server e npm run web em terminais separados.");
