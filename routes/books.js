// routes/books.js
const express = require('express');
const router = express.Router();

// IMPORTANT: point this to your actual DB connection module
// e.g. if your DB file is at ./db.js and it exports a mysql connection named `db`, use:
const db = require('../db'); // <-- replace if your db module path/name is different

// Token verification middleware (protects write routes)
const verifyToken = require('../middleware/auth'); // adjust path if necessary

// ------------------------------
// Helper: parse integer id safely
function parseId(param) {
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : NaN;
}

// ------------------------------
// 1) GET /api/books - Public: return all books
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM books ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB error (GET /api/books):', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

// ------------------------------
// 2) POST /api/books/add - Protected: add a new book
router.post('/add', verifyToken, (req, res) => {
    const { title, author, category, description, pdf_url } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'Title is required' });
    }

    const sql = `
    INSERT INTO books (title, author, category, description, pdf_url)
    VALUES (?, ?, ?, ?, ?)
  `;
    const params = [
        title.trim(),
        author && author.trim() !== '' ? author.trim() : null,
        category && category.trim() !== '' ? category.trim() : null,
        description && description.trim() !== '' ? description.trim() : null,
        pdf_url && pdf_url.trim() !== '' ? pdf_url.trim() : null,
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('DB error (POST /api/books/add):', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Book added', id: result.insertId });
    });
});

// ------------------------------
// 3) PUT /api/books/update/:id - Protected: update a book
router.put('/update/:id', verifyToken, (req, res) => {
    const id = parseId(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    const { title, author, category, description, pdf_url } = req.body || {};
    const fields = [];
    const values = [];

    if (title && typeof title === 'string') { fields.push('title = ?'); values.push(title.trim()); }
    if (author && typeof author === 'string') { fields.push('author = ?'); values.push(author.trim()); }
    if (category && typeof category === 'string') { fields.push('category = ?'); values.push(category.trim()); }
    if (description && typeof description === 'string') { fields.push('description = ?'); values.push(description.trim()); }
    if (pdf_url && typeof pdf_url === 'string') { fields.push('pdf_url = ?'); values.push(pdf_url.trim()); }

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const sql = `UPDATE books SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('DB error (PUT /api/books/update/:id):', err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book updated' });
    });
});

// ------------------------------
// 4) DELETE /api/books/delete/:id - Protected: delete a book
router.delete('/delete/:id', verifyToken, (req, res) => {
    const id = parseId(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    db.query('DELETE FROM books WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('DB error (DELETE /api/books/delete/:id):', err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book deleted' });
    });
});

// ------------------------------
// 5) GET /api/books/:id - Public: return single book by id
// This route is intentionally last so it does not intercept other custom routes.
router.get('/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    db.query('SELECT * FROM books WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('DB error (GET /api/books/:id):', err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (!results || results.length === 0) return res.status(404).json({ message: 'Book not found' });
        res.json(results[0]);
    });
});

module.exports = router;
