const express = require('express');
const router = express.Router();
const { getInstitutionRequests, updateRequestStatus, getInstitutionProfile } = require('../controllers/institutionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, authorize('institution', 'admin'), getInstitutionProfile);

router.route('/requests')
    .get(protect, authorize('institution', 'admin'), getInstitutionRequests);

router.route('/verify/:id')
    .put(protect, authorize('institution'), updateRequestStatus);

module.exports = router;
