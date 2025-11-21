const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Himachal@2025',
    database: process.env.DB_NAME || 'library_db'
});

connection.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err.message);

    } else {
        console.log('MySQL connected!');
    }
});

module.exports = connection;