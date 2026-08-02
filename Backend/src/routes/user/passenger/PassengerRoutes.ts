import express from "express";
import { createPassenger, validateLogin, getPassenger, validateUser, getUpcomingRides, getRecentRides, getPassengerStats, updatePassengerProfile, getActiveTrip, getSavedPlaces, addSavedPlace, deleteSavedPlace } from "@/controllers/user/PassengerController";
import { verifyToken } from "@/middleware/verifyToken";

const router = express.Router();

//use passenger route to create new passenger
router.post("/passengers", createPassenger);
router.post("/login", validateLogin);
router.get("/passenger/:userId", getPassenger);
router.get("/validate/:_id", validateUser);

router.get("/validate", verifyToken, validateUser);
router.get("/me", verifyToken, getPassenger);
router.put("/me", verifyToken, updatePassengerProfile);

router.get("/passengers/active-trip", verifyToken, getActiveTrip);
router.get("/passengers/upcoming-rides", verifyToken, getUpcomingRides);
router.get("/passengers/recent-rides", verifyToken, getRecentRides);
router.get("/passengers/stats", verifyToken, getPassengerStats);

router.get("/passengers/saved-places", verifyToken, getSavedPlaces);
router.post("/passengers/saved-places", verifyToken, addSavedPlace);
router.delete("/passengers/saved-places/:placeId", verifyToken, deleteSavedPlace);

export default router;
