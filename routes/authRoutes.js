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
      age: age ? Number(age) : undefined,     
      weight: weight ? Number(weight) : undefined, 
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

    // 🚀 FIXED: Frontend ko saari details bhejna zaroori hai (Specially Date)
    res.status(200).json({ 
      message: "Login Successful", 
      token: token,
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      lastDonationDate: user.lastDonationDate, // 🚀 Ye Timer ko zinda rakhega
      user: { name: user.name, role: user.role, email: user.email }
    });
  } catch (error) {
    console.error("Login Error: ", error);
    res.status(500).json({ message: "Server error during login!" });
  }
});

// 3. DELETE ACCOUNT API ROUTE (🚀 FIXED FOR ALL USERS)
router.delete('/delete-account/:name', async (req, res) => {
  try {
    const userName = req.params.name;
    
    // Pehle user ko dhundo aur delete karo (Chahe wo Donor, Patient ya Hospital ho)
    const deletedUser = await User.findOneAndDelete({ name: userName });
    
    // Agar delete hone wala user Hospital tha, toh uska Blood Bank (Inventory) bhi uda do
    if (deletedUser && deletedUser.role === 'hospital') {
      const mongoose = require('mongoose');
      const Inventory = mongoose.models.Inventory || mongoose.model('Inventory');
      await Inventory.findOneAndDelete({ hospitalName: userName });
    }
    
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) { 
    res.status(500).json({ message: "Server error!" }); 
  }
});

// 4. GET All Donors (For Wall of Fame)
router.get('/donors', async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json(donors);
  } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

// 5. CHANGE PASSWORD ROUTE (🚀 NAYA)
router.put('/change-password/:email', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userEmail = req.params.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found!" });

    // Purana password verify karo
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password." });

    // Naya password encrypt karke save karo
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error during password update." });
  }
});

// 6. UPDATE PROFILE PICTURE ROUTE (🚀 NAYA)
router.put('/update-profile/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const { profilePicture } = req.body;

    // Database mein profile picture update kar do
    await User.findOneAndUpdate(
      { email: userEmail }, 
      { profilePicture: profilePicture }, 
      { new: true, strict: false } // Strict false taaki agar scheme me nahi bhi hai toh save ho jaye
    );

    res.status(200).json({ message: "Profile updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error updating profile." });
  }
});

module.exports = router;