const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

const db = mysql.createPool({
	host: DB_HOST,
	port: DB_PORT,
	user: DB_USER,
	password: DB_PASS,
	database: DB_NAME,
	connectionLimit: 10,
	charset: 'utf8mb4',
});

module.exports = { db };
