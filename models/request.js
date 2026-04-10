const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  hospitalName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  urgency: { type: String, enum: ['critical', 'high', 'normal'], default: 'high' },
  location: { type: String, required: true }, 
  status: { type: String, enum: ['pending', 'accepted', 'fulfilled'], default: 'pending' },
  
  // 🚀 NAYI LINES: Donor ka data save karne ke liye
  acceptedBy: { type: String, default: null }, // Donor's name
  donorContact: { type: String, default: null } // Donor's numeber
  
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);