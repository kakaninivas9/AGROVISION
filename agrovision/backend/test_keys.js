require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");

async function checkKeys() {
  console.log("=========================================");
  console.log("🔍 Running API Key Validation...");
  console.log("=========================================\n");

  // 1. Check Gemini
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("your_")) {
       console.log("❌ Gemini API Key: MISSING OR PLACEHOLDER");
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Try gemini-pro for baseline access check
      const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 
      await model.generateContent("Hi");
      console.log("✅ Gemini API Key: VALID (gemini-pro)");
    }
  } catch(e) {
    if (e.message.includes("429")) console.log("⏳ Gemini API Key: VALID (but currently Rate Limited)");
    else console.log("❌ Gemini API Key: INVALID -", e.message);
  }

  // 2. Check Cloudinary
  try {
    const name = process.env.CLOUDINARY_CLOUD_NAME;
    const key = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    
    if (!name || !key || !secret || name.includes("your_") || key.includes("your_")) {
      console.log("❌ Cloudinary API Keys: MISSING OR PLACEHOLDER");
    } else {
      cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
      // Clearer error reporting for Cloudinary
      const res = await cloudinary.api.ping().catch(err => { throw err; });
      if (res && res.status === 'ok') console.log("✅ Cloudinary API Keys: VALID");
      else console.log("❌ Cloudinary API Keys: FAILED PING", res);
    }
  } catch(e) {
    console.log("❌ Cloudinary API Keys: INVALID -", e.error?.message || e.message || JSON.stringify(e));
  }

  // 3. OpenWeatherMap
  try {
    const key = process.env.OPENWEATHERMAP_KEY;
    if (!key || key.includes("your_")) {
       console.log("❌ OpenWeatherMap API Key: MISSING OR PLACEHOLDER");
    } else {
      await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${key}`);
      console.log("✅ OpenWeatherMap API Key: VALID");
    }
  } catch(e) {
    console.log("❌ OpenWeatherMap API Key: INVALID -", e.response?.data?.message || e.message);
  }

  console.log("\n=========================================");
}

checkKeys();
