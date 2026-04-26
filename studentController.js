const VerificationRequest = require('../models/VerificationRequest');
const Institution = require('../models/Institution');
const StudentProfile = require('../models/StudentProfile');

// @desc    Submit verification request
// @route   POST /api/student/request
// @access  Private (Student)
const submitRequest = async (req, res, next) => {
    try {
        const { institutionCode, remarks } = req.body;
        
        if (!req.files || !req.files.idProof || !req.files.admissionProof) {
            res.status(400);
            throw new Error('Please upload both ID Proof and Admission Proof');
        }

        const institution = await Institution.findOne({ code: institutionCode });
        if (!institution) {
            res.status(404);
            throw new Error('Institution with given code not found');
        }

        const idProofPath = req.files.idProof[0].filename;
        const admissionProofPath = req.files.admissionProof[0].filename;

        const request = await VerificationRequest.create({
            studentId: req.user._id,
            institutionId: institution._id,
            remarks: remarks || '',
            idProofPath,
            admissionProofPath,
            status: 'pending' // Default to pending so the journey can be tracked
        });

        res.status(201).json(request);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all requests for logged in student
// @route   GET /api/student/requests
// @access  Private (Student)
const getStudentRequests = async (req, res, next) => {
    try {
        const requests = await VerificationRequest.find({ studentId: req.user._id })
            .populate('institutionId', 'name code address')
            .sort({ createdAt: -1 });
            
        res.status(200).json(requests);
    } catch (error) {
        next(error);
    }
};

// @desc    Verify student by enrollment number
// @route   GET /api/student/verify/:enrollmentNo
// @access  Public
const verifyStudent = async (req, res, next) => {
    try {
        const { enrollmentNo } = req.params;

        const profile = await StudentProfile.findOne({ enrollmentNo }).populate('userId', 'name email');
        
        if (!profile) {
            res.status(404);
            throw new Error('Student not found with this enrollment number');
        }

        // Get verification status from requests
        const requests = await VerificationRequest.find({ studentId: profile.userId._id })
            .populate('institutionId', 'name code')
            .sort({ createdAt: -1 });

        const isVerified = requests.some(req => req.status === 'approved');
        
        res.status(200).json({
            name: profile.userId.name,
            enrollmentNo: profile.enrollmentNo,
            isVerified: isVerified,
            requests: requests.map(r => ({
                institution: r.institutionId.name,
                status: r.status,
                date: r.createdAt
            }))
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitRequest,
    getStudentRequests,
    verifyStudent
};
