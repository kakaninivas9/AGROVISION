require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function checkConnection() {
  let output = "=========================================\n🔍 Checking MongoDB Connection...\n=========================================\n\n";

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("No MONGODB_URI found in .env");
    
    // Connect with a 5-second timeout so it doesn't hang forever
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    output += "✅ MongoDB Connection Successful!\n";
    output += `📡 Connected to Atlas Cluster: ${mongoose.connection.host}\n`;
    
  } catch(e) {
    output += "❌ MongoDB Connection FAILED.\n\n";
    output += `Error details: ${e.message}\n\n`;
    
    if (e.message.includes("bad auth") || e.message.includes("Authentication failed")) {
      output += "👉 QUICK FIX (Authentication):\n   Double check your MongoDB password. If it contains special characters, they need to be URL encoded like %40 for @.\n";
    } else if (e.name === 'MongooseServerSelectionError' || e.message.includes("timed out")) {
      output += "👉 QUICK FIX (Network IP Blocked):\n   1. Go to your MongoDB Atlas dashboard.\n   2. On the left sidebar, click 'Network Access' (under Security).\n   3. Click '+ Add IP Address'.\n   4. Click 'ALLOW ACCESS FROM ANYWHERE' (0.0.0.0/0) and hit Confirm.\n   5. Wait 1-2 minutes for it to activate, then test again.\n";
    }
  } finally {
    try { await mongoose.disconnect(); } catch(err){}
    fs.writeFileSync('mongo_result.txt', output);
  }
}

checkConnection();
