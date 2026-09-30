const mongoose = require('mongoose');

async function listUsers() {
  const uri = 'mongodb://localhost:27017/cropguard_pro';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collection = db.collection('users');

  const users = await collection.find({}).toArray();
  console.log("TOTAL USERS FOUND:", users.length);
  users.forEach(u => {
    console.log(`- Email: ${u.email} | Name: ${u.name || u.fullName || 'N/A'}`);
  });
  
  process.exit(0);
}

listUsers();
