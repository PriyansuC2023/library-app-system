// routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Use env variable in production, fallback for local testing
const JWT_SECRET = process.env.JWT_SECRET || "verysecretkey";

/* ===========================
   REGISTER
   POST /auth/register
   body: { username, password }
   =========================== */
router.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    // Hash the password before saving
    const hash = bcrypt.hashSync(password, 10);

    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.query(sql, [username, hash], (err, result) => {
        if (err) {
            console.error("Register DB error:", err);

            // Duplicate username
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({ message: "Username exists" });
            }

            return res.status(500).json({ message: "DB error" });
        }

        return res
            .status(201)
            .json({ message: "User created", id: result.insertId });
    });
});

/* ===========================
   LOGIN
   POST /auth/login
   body: { username, password }
   =========================== */
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, data) => {
        if (err) {
            console.error("LOGIN DB ERROR:", err);
            return res.status(500).json({ message: 'DB error' });
        }

        if (data.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        const user = data[0];

        // because your DB currently stores password as plain text (admin123),
        // we just compare directly for now:
        if (password !== user.password) {
            return res.status(401).json({ message: 'Wrong password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ message: 'Logged in successfully', token });
    });
});

module.exports = router;