const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  hospitalName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  urgency: { type: String, enum: ['critical', 'high', 'normal'], default: 'high' },
  location: { type: String, required: true }, 
  status: { type: String, enum: ['pending', 'accepted', 'fulfilled'], default: 'pending' },
  pincode: { type: String, required: true },
  acceptedBy: { type: String, default: null },
  donorContact: { type: String, default: null }
  
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);