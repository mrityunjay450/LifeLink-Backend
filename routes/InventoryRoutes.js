const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// 🟢 1. GET INVENTORY (Hospital ka stock laane ke liye)
router.get('/:hospitalName', async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;
    let inv = await Inventory.findOne({ hospitalName });

    // Agar naya hospital hai aur database me nahi hai, toh default stock bana do
    if (!inv) {
      inv = new Inventory({ 
        hospitalName, 
        stock: { "A+": 12, "A-": 4, "B+": 18, "B-": 2, "AB+": 8, "AB-": 6, "O+": 25, "O-": 3 } 
      });
      await inv.save();
    }
    res.status(200).json(inv.stock);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching inventory." });
  }
});

// 🟢 2. UPDATE INVENTORY (+ ya - karne ke liye)
router.put('/update', async (req, res) => {
  try {
    const { hospitalName, bloodGroup, change } = req.body;
    let inv = await Inventory.findOne({ hospitalName });

    if (inv) {
      // Stock ko update karo, par 0 se niche mat jane do
      inv.stock[bloodGroup] = Math.max(0, inv.stock[bloodGroup] + change);
      await inv.save();
      res.status(200).json(inv.stock);
    } else {
      res.status(404).json({ message: "Inventory not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error updating inventory." });
  }
});

module.exports = router;