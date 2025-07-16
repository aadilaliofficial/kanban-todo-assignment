const express = require('express');
const router = express.Router();
const { getRecentLogs } = require('../controllers/logController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, getRecentLogs);

module.exports = router;
