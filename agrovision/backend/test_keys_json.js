require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const fs = require('fs');

async function checkKeys() {
  const results = {};

  // 1. Check Gemini
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("your_")) {
       results.gemini = "MISSING OR PLACEHOLDER";
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("Hi");
      results.gemini = "VALID";
    }
  } catch(e) {
    if (e.message.includes("429")) results.gemini = "VALID (but currently Rate Limited)";
    else results.gemini = "INVALID - " + e.message;
  }

  // 2. Check Cloudinary
  try {
    const name = process.env.CLOUDINARY_CLOUD_NAME;
    const key = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    
    if (!name || !key || !secret || name.includes("your_") || key.includes("your_")) {
      results.cloudinary = "MISSING OR PLACEHOLDER";
    } else {
      cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
      const res = await cloudinary.api.ping();
      if (res.status === 'ok') results.cloudinary = "VALID";
      else results.cloudinary = "FAILED PING";
    }
  } catch(e) {
    results.cloudinary = "INVALID - " + e.message;
  }

  // 3. OpenWeatherMap
  try {
    const key = process.env.OPENWEATHERMAP_KEY;
    if (!key || key.includes("your_")) {
       results.openweathermap = "MISSING OR PLACEHOLDER";
    } else {
      await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${key}`);
      results.openweathermap = "VALID";
    }
  } catch(e) {
    results.openweathermap = "INVALID - " + (e.response?.data?.message || e.message);
  }

  fs.writeFileSync('result.json', JSON.stringify(results, null, 2));
}

checkKeys();
