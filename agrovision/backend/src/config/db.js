const mongoose = require("mongoose");

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || "";

  // In production, require a real MongoDB URI
  if (!uri || uri.includes("<username>") || uri.includes("<password>") || uri.includes("xxxxx")) {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: MONGODB_URI is not set. Set it in your environment variables.");
      process.exit(1);
    }

    // Local dev fallback: use mongodb-memory-server
    console.warn("MongoDB URI not configured. Starting in-memory DB for local dev...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();

      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Connected: ${conn.connection.host} (In-Memory)`);

      const User = require("../models/User");
      await User.create({
        name: "Test Farmer",
        email: "test@agrovision.com",
        password: "password123",
      });
      console.log("Seeded test user: test@agrovision.com / password123");
      return;
    } catch (err) {
      console.error("Failed to start in-memory database.", err);
      return;
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host} (Atlas)`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    console.warn("Server will continue without database. Set a valid MONGODB_URI to fix this.");
  }
};

module.exports = connectDB;
