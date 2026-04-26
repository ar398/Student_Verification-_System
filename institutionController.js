const VerificationRequest = require('../models/VerificationRequest');
const Institution = require('../models/Institution');

// @desc    Get all requests for an institution
// @route   GET /api/institution/requests
// @access  Private (Institution)
const getInstitutionRequests = async (req, res, next) => {
    try {
        let institution = await Institution.findOne({ userId: req.user._id });
        
        // FOR TESTING/DEMO: If admin, show requests for the first available institution
        if (!institution && req.user.role === 'admin') {
            institution = await Institution.findOne({});
        }

        if (!institution) {
            res.status(404);
            throw new Error('Institution profile not found');
        }

        const requests = await VerificationRequest.find({ institutionId: institution._id })
            .populate('studentId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        next(error);
    }
};

// @desc    Update request status
// @route   PUT /api/institution/verify/:id
// @access  Private (Institution)
const updateRequestStatus = async (req, res, next) => {
    try {
        const { status, remarks } = req.body;
        
        if(!['approved', 'rejected'].includes(status)) {
            res.status(400);
            throw new Error('Invalid status');
        }

        const request = await VerificationRequest.findById(req.params.id);
        
        if (!request) {
            res.status(404);
            throw new Error('Request not found');
        }

        // Verify this request belongs to this institution
        const institution = await Institution.findOne({ userId: req.user._id });
        if(request.institutionId.toString() !== institution._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this request');
        }

        request.status = status;
        request.remarks = remarks || request.remarks;
        await request.save();

        res.status(200).json(request);
    } catch (error) {
        next(error);
    }
};

// @desc    Get institution profile and stats
// @route   GET /api/institution/profile
// @access  Private (Institution)
const getInstitutionProfile = async (req, res, next) => {
    try {
        console.log('Fetching profile for user:', req.user._id, 'Role:', req.user.role);
        let institution = await Institution.findOne({ userId: req.user._id }).populate('userId', 'email name');
        
        // If Admin is viewing, just show the first institution for testing/demo
        if (!institution && req.user.role === 'admin') {
            console.log('Admin user detected, fetching default institution');
            institution = await Institution.findOne({}).populate('userId', 'email name');
        }

        if (!institution) {
            console.log('Institution NOT FOUND');
            res.status(404);
            throw new Error('Institution profile not found');
        }

        console.log('Institution found:', institution.name, 'ID:', institution._id);

        const stats = {
            totalRequests: await VerificationRequest.countDocuments({ institutionId: institution._id }),
            pendingRequests: await VerificationRequest.countDocuments({ institutionId: institution._id, status: 'pending' }),
            approvedRequests: await VerificationRequest.countDocuments({ institutionId: institution._id, status: 'approved' }),
            verifiedToday: await VerificationRequest.countDocuments({ 
                institutionId: institution._id, 
                status: 'approved',
                updatedAt: { $gte: new Date().setHours(0,0,0,0) }
            })
        };

        console.log('Stats calculated:', stats);

        res.status(200).json({ institution, stats });
    } catch (error) {
        console.error('Controller Error:', error);
        next(error);
    }
};

module.exports = {
    getInstitutionRequests,
    updateRequestStatus,
    getInstitutionProfile
};

