const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// 1. REGISTER API ROUTE
router.post('/register', async (req, res) => {
  try {
    const { 
      role, name, email, mobile, password, 
      bloodGroup, gender, age, weight, 
      hospitalLicense, facilityType, medicalCondition, 
      state, district, address, pincode, website
    } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (userExists) {
      return res.status(400).json({ message: "User with this Email or Mobile already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      role, name, email, mobile, password: hashedPassword,
      bloodGroup, gender, 
      age: age ? Number(age) : undefined,     // Empty field bug fixed
      weight: weight ? Number(weight) : undefined, // Empty field bug fixed
      hospitalLicense, facilityType, medicalCondition,
      state, district, address, pincode, website: website || ""
    });

    await newUser.save();
    res.status(201).json({ message: "Registration Successful! Welcome to LifeLink." });

  } catch (error) {
    console.error("Registration Error: ", error);
    res.status(500).json({ message: "Server error during registration!" });
  }
});

// 2. LOGIN API ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ message: "Account not found. Please register." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password entered." });

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'secretkey', 
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      message: "Login Successful", 
      token: token,
      user: { name: user.name, role: user.role, email: user.email }
    });
  } catch (error) {
    console.error("Login Error: ", error);
    res.status(500).json({ message: "Server error during login!" });
  }
});

// 3. DELETE ACCOUNT API ROUTE
router.delete('/delete-account/:name', async (req, res) => {
  try {
    const hospitalName = req.params.name;
    await User.findOneAndDelete({ name: hospitalName, role: 'hospital' });
    const mongoose = require('mongoose');
    const Inventory = mongoose.models.Inventory || mongoose.model('Inventory');
    await Inventory.findOneAndDelete({ hospitalName: hospitalName });
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

// 4. GET All Donors (For Wall of Fame)
router.get('/donors', async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json(donors);
  } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

module.exports = router;