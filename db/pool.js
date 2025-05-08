const dotenv = require('dotenv').config{ path: '../.env'});
const { Pool, Client } = require('pg');

const pool = new Pool({
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    database: process.env.DATABASE,
    password: process.env.DBPASSWORD,
    port: process.env.DBPORT
});

module.exports = pool;
