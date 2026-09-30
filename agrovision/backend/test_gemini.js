require('dotenv').config({override:true});
const { GoogleGenerativeAI } = require('@google/generative-ai');
async function test() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log("Using Gemini Key:", key.substring(0, 10) + "...");
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("hello");
    console.log("SUCCESS:", result.response.text());
  } catch(e) {
    console.log("HTTP ERROR:", e.message);
  }
}
test();
