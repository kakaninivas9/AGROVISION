const express = require('express');
const router = express.Router();
const { getIotData, pushIotData, getIotHistory } = require('../controllers/iotController');

router.get('/data', getIotData);
router.get('/history', getIotHistory);
router.post('/push', pushIotData);

module.exports = router;
