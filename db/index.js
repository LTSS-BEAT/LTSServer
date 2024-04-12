require('dotenv').config();
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
});

connection.connect((err) => {
    if (err) {
        console.error('db error:', err);
        return;
    }
    console.log('db connected');
});

module.exports = connection;