const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getJobRecommendations, getCandidateRecommendations } = require('../controllers/recommendationController');

const router = express.Router();

router.get('/jobs', protect, authorizeRoles('candidate'), getJobRecommendations);
router.get('/candidates/:jobId', protect, authorizeRoles('employer'), getCandidateRecommendations);

module.exports = router;
