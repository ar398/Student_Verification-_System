const express = require('express');
const router = express.Router();
const { submitRequest, getStudentRequests, verifyStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/request')
    .post(protect, authorize('student'), upload.fields([
        { name: 'idProof', maxCount: 1 },
        { name: 'admissionProof', maxCount: 1 }
    ]), submitRequest);

router.route('/requests')
    .get(protect, authorize('student'), getStudentRequests);

router.route('/verify/:enrollmentNo')
    .get(verifyStudent);

module.exports = router;
