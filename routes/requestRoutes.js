const express = require('express');
const router = express.Router();
const Request = require('../models/request');


// 🟢 1. CREATE NEW REQUEST (Yahan Pop-up ka jaadu add hua hai 🚀)
router.post('/create', async (req, res) => {
  try {
    const newRequest = new Request(req.body);
    await newRequest.save();

    // 🚀 --- SOCKET.IO TRIGGER SHURU --- 🚀
    // Apne server se 'io' nikal rahe hain jo humne server.js me set kiya tha
    const io = req.app.get('socketio'); 
    if (io) {
      // Yahan se saare connected laptops/phones ko signal bhej rahe hain
      io.emit('newBloodRequest', {
        bloodGroup: newRequest.bloodGroup,
        hospitalName: newRequest.hospitalName,
        message: `Urgent! ${newRequest.bloodGroup} needed at ${newRequest.hospitalName}`
      });
      console.log('📢 Notification bheji gayi: ', newRequest.bloodGroup);
    }
    // 🚀 --- SOCKET.IO TRIGGER KHATAM --- 🚀

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
    console.error("Fetch Requests Error: ", error);
    res.status(500).json({ message: "Server error while fetching requests." });
  }
});

// 🟢 3. ACCEPT BLOOD REQUEST (Update: Donor details ke sath)
router.put('/accept/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { donorName, donorContact } = req.body; 

    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      { 
        status: 'accepted', 
        acceptedBy: donorName, 
        donorContact: donorContact 
      },
      { new: true } 
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request nahi mili!" });
    }

    res.status(200).json({ message: "Request accepted successfully!", request: updatedRequest });
  } catch (error) {
    console.error("Accept Request Error: ", error);
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
    console.error("My Requests Error: ", error);
    res.status(500).json({ message: "Server error while fetching history." });
  }
});

// 🟢 5. GET HOSPITAL'S ACCEPTED MATCHES (Hospital check karega kon donor aa raha hai)
router.get('/hospital-matches/:hospitalName', async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;
    // Sirf wahi requests laao jo 'accepted' hain aur is hospital ki hain
    const matches = await Request.find({ 
      hospitalName: hospitalName, 
      status: 'accepted' 
    });
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching matches." });
  }
});

// 🟢 6. MARK REQUEST AS COMPLETED (Jab donor khoon de dega)
router.put('/complete/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const completedRequest = await Request.findByIdAndUpdate(
      requestId,
      { status: 'fulfilled' }, // Status ko fulfilled kar diya
      { new: true }
    );
    res.status(200).json({ message: "Donation verified and completed!", request: completedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error completing request." });
  }
});

module.exports = router;git add .