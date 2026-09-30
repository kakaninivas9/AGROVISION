require('dotenv').config({ override: true });
const Groq = require("groq-sdk");
async function test() {
  try {
    const key = process.env.GROQ_API_KEY;
    console.log("Using key:", key.substring(0, 10) + "...");
    const groq = new Groq({ apiKey: key });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'hello' }],
      model: 'llama-3.3-70b-versatile',
    });
    console.log("SUCCESS:", chatCompletion.choices[0].message.content);
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
test();
