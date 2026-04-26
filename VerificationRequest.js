const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Institution'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    remarks: {
        type: String,
        default: ''
    },
    idProofPath: {
        type: String,
        required: true
    },
    admissionProofPath: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
