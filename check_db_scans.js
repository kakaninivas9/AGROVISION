require('dotenv').config({ path: './agrovision/backend/.env' });
const mongoose = require('mongoose');
const Scan = require('./agrovision/backend/src/models/Scan');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const scans = await Scan.find().sort({ createdAt: -1 }).limit(5);
    console.log("Latest Scans:");
    scans.forEach(s => {
        console.log(`- [${s.createdAt}] ${s.diseaseLabel} (Source: ${s.source})`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
