const express = require('express');
const router = express.Router();
const { getStats, getUsers, deleteUser, getInstitutions, createInstitution, deleteInstitution } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/stats')
    .get(protect, authorize('admin'), getStats);

router.route('/users')
    .get(protect, authorize('admin'), getUsers);

router.route('/users/:id')
    .delete(protect, authorize('admin'), deleteUser);

router.route('/institutions')
    .get(protect, authorize('admin'), getInstitutions)
    .post(protect, authorize('admin'), createInstitution);

router.route('/institutions/:id')
    .delete(protect, authorize('admin'), deleteInstitution);

module.exports = router;
