import express from 'express';
import { createTrip, putTripDriver, putTripPassenger, findDrivers, rateDriver, ratePassenger } from '../../controllers/trip/TripController';
import { verifyToken } from '../../middleware/verifyToken';

const tripRoutes = express.Router();

tripRoutes.post('/trips/newTrip', verifyToken, createTrip);
tripRoutes.put('/trips/putpassenger/:passengerId', verifyToken, putTripPassenger);
tripRoutes.put('/trips/putdriver/:driverId', verifyToken, putTripDriver);
tripRoutes.post('/trips/find-drivers', verifyToken, findDrivers);
tripRoutes.put('/trips/rate-driver/:tripId', verifyToken, rateDriver);
tripRoutes.put('/trips/rate-passenger/:tripId', verifyToken, ratePassenger);

export default tripRoutes;