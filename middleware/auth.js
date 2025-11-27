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
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Make sure frontend actually sent data
    if (!username || !password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], (err, data) => {
        if (err) {
            console.error("Login DB error:", err);
            return res.status(500).json({ message: "DB error" });
        }

        // Username not found
        if (data.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = data[0];

        // If password in DB is bcrypt hash, use bcrypt.compare.
        // If it's plain text (old row you inserted manually), fall back to direct compare.
        let isCorrect = false;
        try {
            if (typeof user.password === "string" && user.password.startsWith("$2")) {
                // looks like a bcrypt hash
                isCorrect = bcrypt.compareSync(password, user.password);
            } else {
                // plain text password stored (not recommended, but handle it)
                isCorrect = password === user.password;
            }
        } catch (e) {
            console.error("Password compare error:", e);
            return res.status(500).json({ message: "Server error" });
        }

        if (!isCorrect) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.json({
            message: "Logged in",
            token,
            user: {
                id: user.id,
                username: user.username,
            },
        });
    });
});

module.exports = router;