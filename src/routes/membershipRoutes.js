const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { updateMembership } = require('../controllers/membershipController');

const router = express.Router();

router.patch('/', protect, updateMembership);

module.exports = router;
