require('dotenv').config({ path: './agrovision/backend/.env' });
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  try {
    console.log("Testing Groq Vision with Key:", process.env.GROQ_API_KEY ? "EXISTS" : "MISSING");
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Is this a plant? Say yes or no." },
            { type: "image_url", image_url: { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Tomato_leaf_on_white_background.jpg/640px-Tomato_leaf_on_white_background.jpg" } }
          ],
        },
      ],
      model: "llama-3.2-11b-vision-preview",
    });
    console.log("Response:", completion.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
