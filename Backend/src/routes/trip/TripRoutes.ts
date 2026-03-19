import express from 'express';
import { createTrip, putTripDriver, putTripPassenger } from '../../controllers/trip/TripController';
import { verifyToken } from '../../middleware/verifyToken';

const tripRoutes = express.Router();

tripRoutes.post('/trips/newTrip', verifyToken, createTrip);
tripRoutes.put('/trips/putpassenger/:passengerId', verifyToken, putTripPassenger);
tripRoutes.put('/trips/putdriver/:driverId', verifyToken, putTripDriver);

export default tripRoutes;