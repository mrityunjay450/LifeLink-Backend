const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 1. Basic Info
  role: { 
    type: String, 
    required: true, 
    enum: ['donor', 'hospital', 'patient']  
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  bloodGroup: { type: String },
  gender: { type: String },
  age: { type: Number },
  weight: { type: Number },

  hospitalLicense: { type: String },
  facilityType: { type: String },
  website: { type: String, default: "" },

  medicalCondition: { type: String },

  state: { type: String, required: true },
  district: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: String, required: true }

}, { timestamps: true }); 

module.exports = mongoose.model('User', userSchema);