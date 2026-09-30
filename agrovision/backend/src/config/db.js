const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../models/User");

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || "";

  // Detect placeholder URI and start in-memory server
  if (!uri || uri.includes("<username>") || uri.includes("<password>") || uri.includes("xxxxx")) {
    console.warn("⚠️  MongoDB URI not configured. Starting an in-memory database for local testing...");
    try {
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host} (In-Memory)`);
      
      // Seed a test user so login works immediately
      const testUser = await User.create({
        name: "Test Farmer",
        email: "test@agrovision.com",
        password: "password123", // Will be hashed by pre-save hook
      });
      console.log(`🌱 Seeded test user: test@agrovision.com / password123`);
      return;
    } catch (err) {
      console.error("Failed to start in-memory database.", err);
      return;
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (Atlas)`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    console.warn("   Server will continue without database. Set a valid MONGODB_URI to fix this.");
  }
};

module.exports = connectDB;
