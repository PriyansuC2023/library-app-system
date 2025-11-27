// db.js
const mysql = require("mysql2");

// 🔴 For simplicity, we hard-code the Railway credentials here.
// (These are the same details that appear in your Railway "Connect" tab)
const db = mysql.createConnection({
    host: "shortline.proxy.rlwy.net",          // your Railway host
    user: "root",                              // your Railway user
    password: "mapcwHLpKaHZGVtvGpQMmvCLldbiXeqT", // your Railway password
    database: "railway",                       // your DB name
    port: 24579,                               // your Railway port
    ssl: { rejectUnauthorized: false }         // needed for Railway TLS
});

db.connect((err) => {
    if (err) {
        console.error("❌ DB Connection Failed:", err);
    } else {
        console.log("✅ Connected to Railway MySQL");
    }
});

module.exports = db;
