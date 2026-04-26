const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
