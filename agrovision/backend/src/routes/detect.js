const express = require("express");
const router = express.Router();
const { detectDisease, getScanHistory } = require("../controllers/detectController");
const { protect } = require("../middleware/auth");
const multer = require("multer");

// Use memory storage so we have the buffer for Flask forwarding
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Images only"), false);
  },
});

router.post("/", protect, upload.single("image"), detectDisease);
router.get("/history", protect, getScanHistory);

module.exports = router;
