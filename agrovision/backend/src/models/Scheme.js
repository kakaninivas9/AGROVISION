const mongoose = require("mongoose");

const schemeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ministry: String,
  description: String,
  eligibility: [String],
  benefits: [String],
  subsidyAmount: String,
  loanAmount: String,
  applicationUrl: String,
  documentUrl: String,
  states: [String], // empty = central (all states)
  category: {
    type: String,
    enum: ["subsidy", "loan", "insurance", "training", "technology"],
  },
  deadline: String,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Scheme", schemeSchema);
