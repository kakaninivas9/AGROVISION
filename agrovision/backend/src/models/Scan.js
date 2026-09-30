const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    diseaseRaw: String,
    diseaseLabel: String,
    confidence: Number,
    isHealthy: Boolean,
    isCritical: Boolean,
    source: { type: String, default: "gemini" },
    primaryConfidence: String,
    fallbackConfidence: String,
    consensus: String,
    fallbackModel: String,
    riskLevel: String,
    spreadProb: String,
    urgency: String,
    impactScore: String,
    treatment: {
      priority: String,
      chemical: String,
      organic: String,
      timeline: String
    },
    context: {
      crop: String,
      stage: String,
      weather: String,
      soil: String
    },
    symptoms: [String],
    causes: [String],
    prevention: [String],
    top5: [
      {
        class: String,
        label: String,
        confidence: Number,
      },
    ],
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model("Scan", scanSchema);
