const express = require("express");
const router = express.Router();
const { detectDiseaseHF } = require("../controllers/detectController");
const { protect } = require("../middleware/auth");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// The user requested /detect-disease specifically
router.post("/detect-disease", protect, upload.single("image"), detectDiseaseHF);

module.exports = router;
