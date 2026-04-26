const VerificationRequest = require('../models/VerificationRequest');
const Institution = require('../models/Institution');
const User = require('../models/User');

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res, next) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalInstitutions = await Institution.countDocuments();
        
        const pendingRequests = await VerificationRequest.countDocuments({ status: 'pending' });
        const approvedRequests = await VerificationRequest.countDocuments({ status: 'approved' });
        const rejectedRequests = await VerificationRequest.countDocuments({ status: 'rejected' });

        const totalProcessed = approvedRequests + rejectedRequests;
        const approvalRate = totalProcessed > 0 ? ((approvedRequests / totalProcessed) * 100).toFixed(1) : 0;

        res.status(200).json({
            users: { students: totalStudents, institutions: totalInstitutions },
            requests: {
                pending: pendingRequests,
                approved: approvedRequests,
                rejected: rejectedRequests,
                total: pendingRequests + approvedRequests + rejectedRequests,
                approvalRate: approvalRate
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // If institution, delete profile too
        if(user.role === 'institution') {
            await Institution.findOneAndDelete({ userId: user._id });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all institutions
// @route   GET /api/admin/institutions
// @access  Private (Admin)
const getInstitutions = async (req, res, next) => {
    try {
        const institutions = await Institution.find().populate('userId', 'email name');
        res.status(200).json(institutions);
    } catch (error) {
        next(error);
    }
};

// @desc    Create an institution manually
// @route   POST /api/admin/institutions
// @access  Private (Admin)
const createInstitution = async (req, res, next) => {
    try {
        const { name, email, password, code, address } = req.body;

        // Create User first
        const userExists = await User.findOne({ email });
        if(userExists) {
            res.status(400);
            throw new Error('User email already exists');
        }

        const user = await User.create({
            name: `${name} Admin`,
            email,
            password,
            role: 'institution'
        });

        // Create Institution profile
        const institution = await Institution.create({
            userId: user._id,
            name,
            code,
            address,
            isVerified: true
        });

        res.status(201).json(institution);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete institution
// @route   DELETE /api/admin/institutions/:id
// @access  Private (Admin)
const deleteInstitution = async (req, res, next) => {
    try {
        const institution = await Institution.findById(req.params.id);
        if(!institution) {
            res.status(404);
            throw new Error('Institution not found');
        }

        // Delete associated user
        await User.findByIdAndDelete(institution.userId);
        
        // Delete institution
        await Institution.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Institution removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getUsers,
    deleteUser,
    getInstitutions,
    createInstitution,
    deleteInstitution
};

