require('dotenv').config({override:true});
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const key = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(key);
    // There is no direct listModels in the SDK usually, but let's check the rest API or try common names.
    // Actually, let's try 'gemini-pro' (1.0) or 'gemini-1.5-pro-latest'.
    console.log("Testing with gemini-1.5-pro-latest...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const result = await model.generateContent("hello");
    console.log("SUCCESS Pro:", result.response.text());
  } catch(e) {
    console.log("ERROR Pro:", e.message);
  }
}
listModels();
