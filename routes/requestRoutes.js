const express = require('express');
const router = express.Router();
const Request = require('../models/request');
const User = require('../models/User'); 
const Inventory = require('../models/Inventory'); // Stock update karne ke liye

// 🟢 1. CREATE NEW REQUEST (Pop-up + Google Script API)
router.post('/create', async (req, res) => {
  try {
    const newRequest = new Request(req.body);
    await newRequest.save();

    // SOCKET.IO TRIGGER (Pop-up ke liye)
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newBloodRequest', {
        bloodGroup: newRequest.bloodGroup,
        hospitalName: newRequest.hospitalName,
        message: `Urgent! ${newRequest.bloodGroup} needed at ${newRequest.hospitalName}`
      });
      console.log('📢 Pop-up Notification sent');
    }

    // 🚀 GOOGLE APPS SCRIPT TRIGGER (Email Bypass)
    try {
      const donors = await User.find({ role: 'donor' });
      const donorEmails = donors.map(donor => donor.email).filter(email => email);

      if (donorEmails.length > 0) {
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx33eaNAr-QN4gxAwz3AQ3k1naBikeSi1MPWDpGCsy1Qxwc1EYRLfGmcSPKM6eMWaPihA/exec";

        const emailData = {
          to: donorEmails.join(','),
          subject: `🚨 URGENT: ${newRequest.bloodGroup} Blood Required!`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #d9534f;">🚨 Urgent Blood Request</h2>
              <p>A new urgent blood request has been posted on LifeLink. A patient needs your help!</p>
              <ul>
                <li><strong>Blood Group Needed:</strong> <span style="color: red; font-size: 18px;">${newRequest.bloodGroup}</span></li>
                <li><strong>Hospital Name:</strong> ${newRequest.hospitalName}</li>
                <li><strong>Location/City:</strong> ${newRequest.location || "Not provided"}</li>
                <li><strong>Contact:</strong> ${newRequest.contactNumber || "Contact Hospital"}</li>
                <li><strong>Patient Name:</strong> ${newRequest.patientName}</li>
              </ul>
              <p>Please log in to your dashboard to help save a life!</p>
              <br/>
              <p>Thank you,<br/><b>Team LifeLink</b></p>
            </div>
          `
        };

        fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(emailData)
        })
          .then(response => response.json())
          .then(data => console.log("✅ Email sent via Google API:", data))
          .catch(err => console.log("❌ Google API Error:", err));
      }
    } catch (emailErr) {
      console.log("Email System Error: ", emailErr);
    }

    res.status(201).json({ message: "Blood request generated successfully!", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error while creating request." });
  }
});

// 🟢 2. GET ALL ACTIVE REQUESTS
router.get('/active', async (req, res) => {
  try {
    const requests = await Request.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching requests." });
  }
});

// 🟢 3. ACCEPT BLOOD REQUEST 
router.put('/accept/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { donorName, donorContact } = req.body;
    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      { status: 'accepted', acceptedBy: donorName, donorContact: donorContact },
      { new: true }
    );
    res.status(200).json({ message: "Request accepted!", request: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error accepting request." });
  }
});

// 🟢 4. GET MY REQUESTS (Patient/Hospital History)
router.get('/my-requests/:name', async (req, res) => {
  try {
    const userName = req.params.name;
    const requests = await Request.find({
      $or: [{ patientName: userName }, { hospitalName: userName }]
    }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history." });
  }
});

// 🟢 5. GET HOSPITAL'S ACCEPTED MATCHES
router.get('/hospital-matches/:hospitalName', async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;
    const matches = await Request.find({ hospitalName: hospitalName, status: 'accepted' });
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Error fetching matches." });
  }
});

// 🟢 6. MARK REQUEST AS COMPLETED & AUTO-UPDATE STOCK (New Feature)
router.put('/complete/:id', async (req, res) => {
  try {
    const requestId = req.params.id;

    // 1. Request dhundo taaki hospitalName aur bloodGroup mil jaye
    const bloodRequest = await Request.findById(requestId);
    if (!bloodRequest) return res.status(404).json({ message: "Request not found" });

    // 2. Status ko fulfilled mark karo
    bloodRequest.status = 'fulfilled';
    await bloodRequest.save();

    // 3. 🚀 AUTO-INCREMENT STOCK LOGIC
    // Inventory mein usi hospital ke us blood group ko +1 unit kar do
    await Inventory.findOneAndUpdate(
      { hospitalName: bloodRequest.hospitalName },
      { $inc: { [`stock.${bloodRequest.bloodGroup}`]: 1 } }
    );

    console.log(`✅ Stock +1 for ${bloodRequest.bloodGroup} at ${bloodRequest.hospitalName}`);
    res.status(200).json({ message: "Donation completed and Stock updated!", request: bloodRequest });
  } catch (error) {
    console.error("Complete Route Error:", error);
    res.status(500).json({ message: "Error updating stock and completing request." });
  }
});

// 🟢 7. GET DONOR HISTORY (Sirf Verified/Completed Donations)
router.get('/donor-history/:donorName', async (req, res) => {
  try {
    const donorName = req.params.donorName;
    // Status 'fulfilled' matlab Hospital ne verify kar liya hai
    const history = await Request.find({ acceptedBy: donorName, status: 'fulfilled' }).sort({ updatedAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching donor history." });
  }
});

module.exports = router;