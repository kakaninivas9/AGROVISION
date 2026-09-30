const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://localhost:27017/cropguard_pro';

async function check() {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find({});
    console.log("Users in DB:", users.map(u => ({ name: u.fullName, email: u.email })));
    process.exit();
}

check();
