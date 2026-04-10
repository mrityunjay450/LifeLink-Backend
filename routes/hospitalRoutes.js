const express = require('express');
const router = express.Router();
// Dhyan de: Yahan apne User model ka sahi path daalein (Jisme aap registration save karte hain)
const User = require('../models/User'); 

// 🟢 GET ALL REGISTERED HOSPITALS
router.get('/list', async (req, res) => {
  try {
    // Sirf unhi users ko dhundho jinka role 'hospital' hai
    // Password hide karne ke liye hum select('-password') use karte hain
    const hospitals = await User.find({ role: 'hospital' }).select('-password');
    res.status(200).json(hospitals);
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ message: "Server error fetching hospitals" });
  }
});

module.exports = router;