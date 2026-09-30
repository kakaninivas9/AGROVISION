require('dotenv').config({override:true});
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const key = process.env.GEMINI_API_KEY;
        console.log("Using Key:", key.substring(0, 10) + "...");
        
        // Use standard fetch to call ListModels API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("No models returned. Response:", JSON.stringify(data));
        }
    } catch (e) {
        console.log("Error listing models:", e.message);
    }
}
listModels();
