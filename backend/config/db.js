const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function checkConnection() {
  try {
    const connection = await db.getConnection();

    console.log("MySQL database connected");

    connection.release();
  } catch (error) {
    console.log("Database connection failed");
    console.log(error.message);
  }
}

checkConnection();

module.exports = db;