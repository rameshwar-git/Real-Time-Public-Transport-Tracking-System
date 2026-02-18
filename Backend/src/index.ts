import express from 'express';
import {connectDB} from '@config/db';
import passengerRoutes from '@/routes/user/passenger/PassengerRoutes';
import driverRoutes from '@/routes/user/driver/DriverRoutes';
import locationRoutes from '@/routes/location/LocationRoutes';
import tripRoutes from '@routes/trip/TripRoutes';

import dotenv from 'dotenv';

dotenv.config();
connectDB().catch(console.dir);

const app = express();
app.use(express.json());

app.use('/api', passengerRoutes);
app.use('/api', driverRoutes);
app.use('/api', locationRoutes)
app.use('/api', tripRoutes);

const PORT = parseInt(process.env.PORT || "5000", 10);
const ID = process.env.NETWORK_ID as string;
app.listen(PORT, ID , () => {
    console.log(`Server running on ${ID}:${PORT}`);
});
