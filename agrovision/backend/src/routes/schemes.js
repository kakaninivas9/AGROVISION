const express = require("express");
const router = express.Router();
const { getSchemes } = require("../controllers/schemesController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getSchemes);

module.exports = router;
