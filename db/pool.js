const dotenv = require('dotenv').config();
const { Pool } = require('pg');

// Establishing the connection to database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

module.exports = pool;
