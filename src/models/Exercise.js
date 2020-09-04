const mongoose = require('mongoose');

const Exercise = mongoose.model('Exercise', new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true }
}));

module.exports = Exercise;
