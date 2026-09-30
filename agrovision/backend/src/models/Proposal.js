const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: String,
    text: String,
  },
  { timestamps: true }
);

const proposalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: String,
    problem: { type: String, required: true },
    solution: { type: String, required: true },
    expectedImpact: String,
    budget: Number,
    category: {
      type: String,
      enum: ["irrigation", "pest-control", "soil", "technology", "marketing", "other"],
      default: "other",
    },
    state: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    status: { type: String, enum: ["open", "under-review", "implemented"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proposal", proposalSchema);
