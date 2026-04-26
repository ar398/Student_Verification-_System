const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    phone: {
        type: String,
        required: true
    },
    enrollmentNo: {
        type: String,
        required: true
    },
    documents: [{
        type: String // File paths for additional profile documents if needed
    }]
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
