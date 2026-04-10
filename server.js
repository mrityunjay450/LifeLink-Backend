const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 🟢 Middlewares
app.use(cors()); 
app.use(express.json()); 

// 🟢 MongoDB Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🔥 MongoDB Successfully Connected!'))
  .catch((err) => console.log('❌ MongoDB Connection Error: ', err));

// 🟢 Default Test Route
app.get('/', (req, res) => {
  res.send('LifeLink Backend is Running...');
});

// 🚀 ----- API ROUTES ----- 🚀
// Dhyan rakhein: Saare routes app.listen se pehle aane chahiye!

// 1. Authentication (Login/Register)
const authRoutes = require('./routes/authRoutes'); // check if your file is named autoRoutes.js or authRoutes.js
app.use('/api/auth', authRoutes);

// 2. Inventory Management
const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

// 3. Urgent Blood Requests
const requestRoutes = require('./routes/requestRoutes');
app.use('/api/requests', requestRoutes);

// 4. Hospitals List
const hospitalRoutes = require('./routes/hospitalRoutes');
app.use('/api/hospitals', hospitalRoutes);

// 5. 🚀 NAYA: Donation Camps
const campRoutes = require('./routes/campRoutes'); 
app.use('/api/camps', campRoutes);


// 🟢 Server Start (Ye hamesha sabse last me hona chahiye)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});