const express = require('express');
const router = express.Router();
const Camp = require('../models/Camp');

// 1. POST: Create Camp
router.post('/create', async (req, res) => {
  try {
    const newCamp = new Camp(req.body);
    await newCamp.save();
    res.status(201).json({ message: "Camp Organized Successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error creating camp" });
  }
});

// 2. GET: All Active Camps (Donation Camps Page ke liye)
router.get('/all', async (req, res) => {
  try {
    // 🚀 FIXED: Sirf wahi camps bhejo jo 'Upcoming' ya 'Ongoing' hain
    const camps = await Camp.find({ status: { $ne: 'Completed' } }).sort({ createdAt: -1 });
    res.status(200).json(camps);
  } catch (error) {
    res.status(500).json({ message: "Error fetching camps" });
  }
});

// 3. 🚀 NAYA: GET Hospital's Own Camps (Dashboard ke liye)
router.get('/hospital/:hospitalName', async (req, res) => {
  try {
    const camps = await Camp.find({ hospitalName: req.params.hospitalName }).sort({ createdAt: -1 });
    res.status(200).json(camps);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hospital camps" });
  }
});

// 4. 🚀 NAYA: PUT Mark Camp as Completed
router.put('/complete/:id', async (req, res) => {
  try {
    await Camp.findByIdAndUpdate(req.params.id, { status: 'Completed' });
    res.status(200).json({ message: "Camp marked as completed" });
  } catch (error) {
    res.status(500).json({ message: "Error updating camp status" });
  }
});

module.exports = router;