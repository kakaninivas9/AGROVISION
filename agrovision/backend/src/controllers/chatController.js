const Groq = require("groq-sdk");

const SYSTEM_PROMPT = `You are AgroBot, an expert AI farming assistant for Indian farmers. 
You specialize in:
- Crop disease diagnosis and treatment
- Fertilizer and pesticide recommendations
- Soil management and irrigation advice
- Crop selection based on season and region
- Government agricultural schemes
- Weather-based farming decisions

Always give practical, cost-effective advice suitable for small and medium Indian farmers.
Provide specific product names, dosages, and timelines when recommending treatments.
Be concise but thorough. If asked in Hindi or regional languages, respond in that language.`;

// POST /api/chat
const chat = async (req, res) => {
  try {
    const { message, history = [], language = "en" } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Check if API key is configured
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_api_key" || !apiKey.startsWith("gsk_")) {
      return res.json({ 
        reply: "⚠️ I am currently running in demo mode because the Groq API key is not configured. To enable superfast Llama 3 chat, please add your real API key to the backend `.env` file.", 
        language 
      });
    }

    const groq = new Groq({ apiKey });

    // Build OpenAI-style message history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "assistant", content: "Understood! I am AgroBot, your AI farming assistant. How can I help you today?" }
    ];

    history.forEach((msg) => {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      });
    });

    messages.push({ role: "user", content: message });

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_completion_tokens: 1024,
    });

    const response = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    res.json({ reply: response, language });
  } catch (err) {
    console.error("[chat] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { chat };

