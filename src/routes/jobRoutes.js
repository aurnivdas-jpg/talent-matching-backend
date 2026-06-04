const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { createJobPosting, getJobs, searchJobs } = require('../controllers/jobController');
const handleValidation = require('../utils/validationResult');

const router = express.Router();

router.get('/', getJobs);
router.get('/search', searchJobs);

router.post(
  '/',
  protect,
  authorizeRoles('employer'),
  [
    body('jobTitle').notEmpty().withMessage('jobTitle is required'),
    body('jobDescription').notEmpty().withMessage('jobDescription is required'),
    body('requiredExperience').optional().isNumeric().withMessage('requiredExperience must be numeric')
  ],
  handleValidation,
  createJobPosting
);

module.exports = router;
