// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'verysecretkey';

// REGISTER
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: 'Missing fields' });

    const hash = bcrypt.hashSync(password, 10);

    db.query('INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hash],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY')
                    return res.status(400).json({ message: 'Username exists' });

                return res.status(500).json({ message: 'DB error' });
            }
            res.status(201).json({ message: 'User created', id: result.insertId });
        }
    );
});

// LOGIN
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, data) => {
        if (err) return res.status(500).json({ message: 'DB error' });

        if (data.length === 0)
            return res.status(401).json({ message: 'Invalid credentials' });

        const user = data[0];
        const isCorrect = bcrypt.compareSync(password, user.password);

        if (!isCorrect)
            return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ message: 'Logged in', token });
    });
});

module.exports = router;