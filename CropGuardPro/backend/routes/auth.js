const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cropguard_secret_key_2026';

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, farmName, farmLocation, password } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ fullName, email, phone, farmName, farmLocation, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: user._id, fullName, email, farmName } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or fullName
        const user = await User.findOne({ 
            $or: [
                { email: identifier },
                { fullName: identifier }
            ]
        });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, farmName: user.farmName } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get profile (Auth required)
router.get('/me', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
});

module.exports = router;
