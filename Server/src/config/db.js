const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ortoo_db",
  port: Number(process.env.DB_PORT) || 3306,
                            waitForConnections: true,
                            connectionLimit: 10,
                            queueLimit: 0,
});

module.exports = db;


