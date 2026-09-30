const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5055;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cropguard_pro';

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for easier integration with CDNs in this prototype
}));

// Serves static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);

// Database Connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Fallback to index.html for unknown routes (SPA behavior-ish)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
