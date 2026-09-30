const Proposal = require("../models/Proposal");

// GET /api/proposals
const getProposals = async (req, res) => {
  try {
    const { category, state, sort = "latest" } = req.query;

    let query = {};
    if (category) query.category = category;
    if (state) query.state = state;

    const sortOpt = sort === "popular" ? { "likes.length": -1 } : { createdAt: -1 };

    const proposals = await Proposal.find(query)
      .sort(sortOpt)
      .limit(50)
      .populate("userId", "name");

    res.json({ count: proposals.length, proposals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/proposals
const createProposal = async (req, res) => {
  try {
    const { problem, solution, expectedImpact, budget, category, state } = req.body;

    if (!problem || !solution)
      return res.status(400).json({ error: "Problem and solution are required" });

    const proposal = await Proposal.create({
      userId: req.user._id,
      userName: req.user.name,
      problem,
      solution,
      expectedImpact,
      budget,
      category,
      state,
    });

    res.status(201).json({ proposal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/proposals/:id/like
const toggleLike = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    const userId = req.user._id.toString();
    const likeIndex = proposal.likes.findIndex((id) => id.toString() === userId);

    if (likeIndex === -1) {
      proposal.likes.push(req.user._id);
    } else {
      proposal.likes.splice(likeIndex, 1);
    }

    await proposal.save();
    res.json({ likes: proposal.likes.length, liked: likeIndex === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/proposals/:id/comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text is required" });

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    proposal.comments.push({
      userId: req.user._id,
      userName: req.user.name,
      text,
    });
    await proposal.save();

    res.json({ comment: proposal.comments[proposal.comments.length - 1] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProposals, createProposal, toggleLike, addComment };
