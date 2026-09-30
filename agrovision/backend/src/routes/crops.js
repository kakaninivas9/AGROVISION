const express = require("express");
const router = express.Router();
const { getCrops, calculateIncome } = require("../controllers/cropsController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getCrops);
router.post("/calculate", protect, calculateIncome);

module.exports = router;
