// server.jss
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();

// --- MIDDLEWARE (order matters!) ---
app.use(cors());

// JSON body parser must be registered BEFORE your routes
app.use(express.json());

// helpful small JSON parse error handler (returns a nice 400)
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
        console.error('Invalid JSON body:', err.message);
        return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    next(err);
});

// compute absolute path to the public folder
const PUBLIC_DIR = path.join(__dirname, 'public');
console.log('Server script __dirname:', __dirname);
console.log('Computed public folder:', PUBLIC_DIR);
console.log('public folder exists:', fs.existsSync(PUBLIC_DIR));

// serve static frontend files
app.use(express.static(PUBLIC_DIR));

// optional simple test
app.get('/test', (req, res) => res.send('TEST OK'));

// mount auth routes (ensure your auth file exports an express router)
const authRoutes = require('./middleware/auth'); // you said auth.js is in middleware/
app.use('/api/auth', authRoutes);

// mount books routes (make sure it requires the right file)
const bookRoutes = require('./routes/books');
app.use('/api/books', bookRoutes);

// generic 404 for /api
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'Not Found' });
    next();
});

// final error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
