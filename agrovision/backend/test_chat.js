const axios = require("axios");

async function testChat() {
  try {
    // Generate a quick fake JWT just to pass the protect middleware
    const jwt = require("jsonwebtoken");
    require("dotenv").config();
    const token = jwt.sign({ id: "65e23abc1234567890abcdef" }, process.env.JWT_SECRET || "agrovision_jwt_secret_change_this_in_production_2026", { expiresIn: "1h" });

    const res = await axios.post("http://localhost:5001/api/chat", {
      message: "How to treat apple scab?",
      history: []
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("HTTP ERROR:", err.response.status, err.response.data);
    } else {
      console.log("NETWORK ERROR:", err.message);
    }
  }
}

testChat();
