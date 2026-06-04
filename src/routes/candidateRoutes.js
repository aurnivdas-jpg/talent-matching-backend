const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { updateCandidateProfile, getCandidateProfile, searchCandidates } = require('../controllers/candidateController');
const handleValidation = require('../utils/validationResult');

const router = express.Router();

router.get('/profile', protect, authorizeRoles('candidate'), getCandidateProfile);

router.post(
  '/profile',
  protect,
  authorizeRoles('candidate'),
  [
    body('yearsExperience').optional().isNumeric().withMessage('yearsExperience must be numeric'),
    body('skills').optional().isString().withMessage('skills must be comma-separated text')
  ],
  handleValidation,
  updateCandidateProfile
);

router.get('/search', protect, authorizeRoles('employer'), searchCandidates);

module.exports = router;
