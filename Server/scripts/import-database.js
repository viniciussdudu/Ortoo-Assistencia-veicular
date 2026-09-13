require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function importDatabase() {
  const database = process.env.DB_NAME;

  if (!database || !/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('DB_NAME deve conter apenas letras, números e sublinhado.');
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    multipleStatements: true,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${database}`);
    await connection.query(`USE ${database}`);

    const schemaPath = path.join(__dirname, '..', 'database', 'ortoo_db.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schema);

    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Banco ${database} importado. Tabelas: ${tables.map((row) => Object.values(row)[0]).join(', ')}`);
  } finally {
    await connection.end();
  }
}

importDatabase().catch((error) => {
  console.error('Não foi possível importar o banco:', error);
  process.exitCode = 1;
});
