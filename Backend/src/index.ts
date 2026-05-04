import express from 'express';
import http from 'http';
import { connectDB } from '@config/db';
import passengerRoutes from '@/routes/user/passenger/PassengerRoutes';
import driverRoutes from '@/routes/user/driver/DriverRoutes';
import locationRoutes from '@/routes/location/LocationRoutes';
import tripRoutes from '@routes/trip/TripRoutes';
import { Server } from 'socket.io'
import initSocket from '@/socket/initSocket'

import dotenv from 'dotenv';

dotenv.config();
connectDB().catch(console.dir);

const app = express();
app.use(express.json());

app.use('/api', passengerRoutes);
app.use('/api', driverRoutes);
app.use('/api', locationRoutes);
app.use('/api', tripRoutes);


const PORT = parseInt(process.env.PORT || "5000", 10);
const ID = process.env.NETWORK_ID as string;


const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

initSocket(io);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});