// server.jss
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();

// ================== MIDDLEWARE ==================

// ✅ Allow requests from anywhere (good for Railway + frontend hosting)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// JSON parser
app.use(express.json());

// Friendly JSON error handler
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
        console.error('Invalid JSON body:', err.message);
        return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    next(err);
});


// ================== STATIC FRONTEND ==================

const PUBLIC_DIR = path.join(__dirname, 'public');

console.log('Server directory:', __dirname);
console.log('Public folder path:', PUBLIC_DIR);
console.log('Public folder exists:', fs.existsSync(PUBLIC_DIR));

app.use(express.static(PUBLIC_DIR));


// ================== TEST ROUTE ==================

app.get('/test', (req, res) => {
    res.send('✅ SERVER WORKING');
});


// ================== API ROUTES ==================

// AUTH routes
const authRoutes = require('./middleware/auth');
app.use('/api/auth', authRoutes);

// BOOK routes
const bookRoutes = require('./routes/books');
app.use('/api/books', bookRoutes);


// ================== 404 HANDLER FOR API ==================

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API Route Not Found' });
    }
    next();
});


// ================== GLOBAL ERROR HANDLER ==================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});


// ================== START SERVER ==================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});