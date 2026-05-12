const express = require('express');
const router = express.Router();
const Camp = require('../models/Camp');
const User = require('../models/User');

// 1. POST: Create Camp & Send Email via Google Script
router.post('/create', async (req, res) => {
  try {
    // 1. Camp ko database me save karein
    const newCamp = new Camp(req.body);
    await newCamp.save();

    // 🚀 2. GOOGLE APPS SCRIPT TRIGGER (Email Bypass)
    try {
      const donors = await User.find({ role: 'donor' });
      const donorEmails = donors.map(donor => donor.email).filter(email => email);

      if (donorEmails.length > 0) {
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx33eaNAr-QN4gxAwz3AQ3k1naBikeSi1MPWDpGCsy1Qxwc1EYRLfGmcSPKM6eMWaPihA/exec";

        const emailData = {
          to: donorEmails.join(','),
          subject: `🩸 New Blood Donation Camp: ${newCamp.campName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #d9534f;">📅 Blood Donation Camp Organized</h2>
              <p>Hello Donor,</p>
              <p>A new blood donation camp has been organized by <b>${newCamp.hospitalName}</b>.</p>
              <p>We invite you to come forward and help save lives!</p>
              <br/>
              <h4>Camp Details:</h4>
              <ul>
                <li><strong>Camp Name:</strong> ${newCamp.campName}</li>
                <li><strong>Date:</strong> ${newCamp.date}</li>
                <li><strong>Time:</strong> ${newCamp.time}</li>
                <li><strong>Location/Venue:</strong> ${newCamp.location}</li>
              </ul>
              <p>Please visit the LifeLink app for more information or to view the location on the map.</p>
              <br/>
              <p>Thank you,<br/><b>Team LifeLink</b></p>
            </div>
          `
        };

        // Node 18+ me fetch by default kaam karta hai
        fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(emailData)
        })
          .then(response => response.json())
          .then(data => console.log("✅ Camp Email sent via Google API:", data))
          .catch(err => console.log("❌ Google API Error:", err));
      }
    } catch (emailErr) {
      console.log("Email System Error: ", emailErr);
    }

    res.status(201).json({ message: "Camp Organized Successfully & Donors Notified!" });
  } catch (error) {
    console.error("Camp Create Error:", error);
    res.status(500).json({ message: "Error creating camp" });
  }
});

// 2. GET: All Active Camps (Donation Camps Page ke liye)
router.get('/all', async (req, res) => {
  try {
    // Sirf wahi camps bhejo jo 'Completed' nahi hain
    const camps = await Camp.find({ status: { $ne: 'Completed' } }).sort({ createdAt: -1 });
    res.status(200).json(camps);
  } catch (error) {
    res.status(500).json({ message: "Error fetching camps" });
  }
});

// 3. GET: Hospital's Own Camps by ID (Dashboard ke liye)
router.get('/hospital/:hospitalId', async (req, res) => {
  try {
    const camps = await Camp.find({ hospitalId: req.params.hospitalId }).sort({ date: -1 });
    res.status(200).json(camps);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hospital camps" });
  }
});

// 4. GET: Hospital Camps by Name (Conflict se bachne ke liye URL change kiya hai)
router.get('/hospital-name/:hospitalName', async (req, res) => {
  try {
    const camps = await Camp.find({ hospitalName: req.params.hospitalName }).sort({ createdAt: -1 });
    res.status(200).json(camps);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hospital camps by name" });
  }
});

// 5. PUT: Mark Camp as Completed
router.put('/complete/:id', async (req, res) => {
  try {
    await Camp.findByIdAndUpdate(req.params.id, { status: 'Completed' });
    res.status(200).json({ message: "Camp marked as completed" });
  } catch (error) {
    res.status(500).json({ message: "Error updating camp status" });
  }
});

// 🟢 6. NAYA: Camp me naye donor ki entry save karna (Future Record ke liye)
router.post('/:id/add-donor', async (req, res) => {
  try {
    const campId = req.params.id;
    const donorData = req.body; // Frontend se donor ka naam, blood group aayega

    // Camp dhoondho aur uski donorsList me naya donor push kar do
    const updatedCamp = await Camp.findByIdAndUpdate(
      campId,
      { $push: { donorsList: donorData } },
      { new: true } // Update hone ke baad naya data return karega
    );

    if (!updatedCamp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    res.status(200).json({ message: "Donor record saved successfully!", camp: updatedCamp });
  } catch (error) {
    console.error("Error adding donor to camp:", error);
    res.status(500).json({ message: "Server error while saving donor" });
  }
});

module.exports = router;