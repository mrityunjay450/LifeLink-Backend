const express = require('express');
const router = express.Router();
const Request = require('../models/request');
const User = require('../models/User'); // 🚀 Donors ki email nikalne ke liye User model import kiya
const nodemailer = require('nodemailer'); // 🚀 Email bhejne wala tool

// 🚀 --- EMAIL SETUP SHURU --- 🚀
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});
// 🚀 --- EMAIL SETUP KHATAM --- 🚀

// 🟢 1. CREATE NEW REQUEST (Pop-up + Email)
router.post('/create', async (req, res) => {
  try {
    const newRequest = new Request(req.body);
    await newRequest.save();

    // 1. SOCKET.IO TRIGGER (Pop-up ke liye)
    const io = req.app.get('socketio'); 
    if (io) {
      io.emit('newBloodRequest', {
        bloodGroup: newRequest.bloodGroup,
        hospitalName: newRequest.hospitalName,
        message: `Urgent! ${newRequest.bloodGroup} needed at ${newRequest.hospitalName}`
      });
    }

    // 🚀 2. NODEMAILER TRIGGER (Email bhejne ke liye)
    try {
      // Database se un sabhi users ko nikaalo jo 'Donor' hain
      const donors = await User.find({ role: 'donor' }); 
      
      // Unki email IDs ka ek list (array) banao
      const donorEmails = donors.map(donor => donor.email).filter(email => email);

      if (donorEmails.length > 0) {
        const mailOptions = {
          from: `"LifeLink Urgent" <${process.env.EMAIL_USER}>`, // Bhejne wale ka naam
          to: donorEmails, // Saare donors ki email list
          subject: `🚨 URGENT: ${newRequest.bloodGroup} Blood Required!`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #d9534f;">🚨 Urgent Blood Request</h2>
              <p>A new urgent blood request has been posted on LifeLink. A patient needs your help!</p>
              <ul>
                <li><strong>Blood Group Needed:</strong> <span style="color: red; font-size: 18px;">${newRequest.bloodGroup}</span></li>
                <li><strong>Hospital Name:</strong> ${newRequest.hospitalName}</li>
                <li><strong>Patient Name:</strong> ${newRequest.patientName}</li>
              </ul>
              <p>Please log in to your <b>LifeLink Dashboard</b> immediately to accept this request and save a life. Every second counts!</p>
              <br/>
              <p>Thank you,<br/><b>Team LifeLink</b></p>
            </div>
          `
        };

        // Email Send kardo
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.log("❌ Email bhejne me error: ", error);
          else console.log("✅ Emails sent successfully to all Donors!");
        });
      }
    } catch (emailErr) {
      console.log("Email System Error: ", emailErr);
    }
    // 🚀 --- NODEMAILER TRIGGER KHATAM --- 🚀

    res.status(201).json({ message: "Blood request generated successfully!", request: newRequest });
  } catch (error) {
    console.error("Request Create Error: ", error);
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

    if (!updatedRequest) return res.status(404).json({ message: "Request nahi mili!" });
    res.status(200).json({ message: "Request accepted successfully!", request: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error while accepting request." });
  }
});

// 🟢 4. GET MY REQUESTS
router.get('/my-requests/:name', async (req, res) => {
  try {
    const userName = req.params.name;
    const requests = await Request.find({ 
      $or: [{ patientName: userName }, { hospitalName: userName }] 
    }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching history." });
  }
});

// 🟢 5. GET HOSPITAL'S ACCEPTED MATCHES
router.get('/hospital-matches/:hospitalName', async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;
    const matches = await Request.find({ hospitalName: hospitalName, status: 'accepted' });
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching matches." });
  }
});

// 🟢 6. MARK REQUEST AS COMPLETED 
router.put('/complete/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const completedRequest = await Request.findByIdAndUpdate(
      requestId,
      { status: 'fulfilled' }, 
      { new: true }
    );
    res.status(200).json({ message: "Donation verified and completed!", request: completedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error completing request." });
  }
});

module.exports = router;