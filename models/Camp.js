const mongoose = require('mongoose');

const campSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalName: { type: String, required: true },
  campName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'Upcoming' } // Upcoming, Ongoing, Completed
}, { timestamps: true });

module.exports = mongoose.model('Camp', campSchema);