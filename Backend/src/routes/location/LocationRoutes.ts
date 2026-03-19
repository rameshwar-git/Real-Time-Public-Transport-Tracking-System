import express from 'express';
import {
    updatePassengerLocation,
    updateDriverLocation,
    getAllPassengerLocations,
    getAllDriverLocations
} from '@/controllers/location/LocationController';
import { verifyToken } from '@/middleware/verifyToken';

const locationRoutes = express.Router();

// Passenger Routes
locationRoutes.put('/passenger/location/update/:locationId', verifyToken, updatePassengerLocation);
locationRoutes.get('/passenger/location/all', verifyToken, getAllPassengerLocations);

// Driver Routes
locationRoutes.put('/driver/location/update/:locationId', verifyToken, updateDriverLocation);
locationRoutes.get('/driver/location/all', verifyToken, getAllDriverLocations);


export default locationRoutes;