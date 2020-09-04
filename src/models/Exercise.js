const mongoose = require('mongoose');

const Exercise = mongoose.model('Exercise', new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: false }
}));

module.exports = Exercise;
