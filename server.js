const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// 🚀 1. NAYA ADD KIYA HAI: http aur socket.io import karein
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// 🚀 2. NAYA ADD KIYA HAI: Express app ko HTTP server ke andar daalein
const server = http.createServer(app);

// 🚀 3. NAYA ADD KIYA HAI: Socket.io ka setup karein
const io = new Server(server, {
  cors: {
    origin: "*", // Vercel aur localhost dono ko allow karega
    methods: ["GET", "POST"]
  }
});

// Taaki hum kisi bhi route (jaise requestRoutes.js) se notification bhej sakein
app.set('socketio', io);

// Jab bhi koi naya Donor/Hospital login karega, ye chalega
io.on('connection', (socket) => {
  console.log('🟢 Naya Live Connection Juda: ', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Connection Toot Gaya: ', socket.id);
  });
});

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
// 1. Authentication (Login/Register)
const authRoutes = require('./routes/authRoutes'); 
app.use('/api/auth', authRoutes);

// 2. Inventory Management
const inventoryRoutes = require('./routes/InventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

// 3. Urgent Blood Requests
const requestRoutes = require('./routes/requestRoutes');
app.use('/api/requests', requestRoutes);

// 4. Hospitals List
const hospitalRoutes = require('./routes/hospitalRoutes');
app.use('/api/hospitals', hospitalRoutes);

// 5. Donation Camps
const campRoutes = require('./routes/campRoutes'); 
app.use('/api/camps', campRoutes);


// 🟢 Server Start (Ye hamesha sabse last me hona chahiye)
// 🚀 4. NAYA UPDATE KIYA HAI: app.listen ko change karke server.listen karna hai!
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});