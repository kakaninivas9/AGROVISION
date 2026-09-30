require('dotenv').config({override:true});
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testPrefix() {
  try {
    const key = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(key);
    console.log("Testing with models/gemini-1.5-pro...");
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
    const result = await model.generateContent("hello");
    console.log("SUCCESS:", result.response.text());
  } catch(e) {
    console.log("ERROR:", e.message);
  }
}
testPrefix();
