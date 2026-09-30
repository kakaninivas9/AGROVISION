const express = require("express");
const router = express.Router();
const { getProposals, createProposal, toggleLike, addComment } = require("../controllers/proposalsController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getProposals);
router.post("/", protect, createProposal);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);

module.exports = router;
