const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameHindi: String,
  season: { type: String, enum: ["kharif", "rabi", "zaid", "all-year"] },
  waterRequirement: { type: String, enum: ["low", "medium", "high"] },
  riskLevel: { type: String, enum: ["low", "medium", "high"] },
  yieldPerAcre: Number, // in quintals
  avgPricePerQuintal: Number, // INR
  costPerAcre: Number, // INR (cultivation cost)
  daysToHarvest: Number,
  soilType: [String],
  states: [String],
  description: String,
  fertilizers: [String],
  commonDiseases: [String],
});

module.exports = mongoose.model("Crop", cropSchema);
