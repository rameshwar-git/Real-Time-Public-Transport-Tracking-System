import express from "express";
import {
    createDriver,
    setDriverVehicle,
    validateDriverLogin,
    validateDriver,
    getDriverEarnings,
    getWeeklyEarnings,
    getDriverProfile,
    updateDriverProfile,
    getActiveDriverTrips
} from "@/controllers/user/DriverController";
import { verifyToken } from "@/middleware/verifyToken";

const router = express.Router();

//use passenger route to create new passenger
router.post("/drivers", createDriver);
//login for driver
router.post("/drivers/login", validateDriverLogin);
//use this route to set vehicle data for driver
router.put("/drivers/vehicles/:driverId", verifyToken, setDriverVehicle);

//validate driver token
router.get("/drivers/validate", verifyToken, validateDriver);

router.get("/drivers/active-trips", verifyToken, getActiveDriverTrips);
//get driver earnings
router.get("/drivers/earnings", verifyToken, getDriverEarnings);

//get weekly earnings breakdown
router.get("/drivers/weekly-earnings", verifyToken, getWeeklyEarnings);

// Profile
router.get("/drivers/profile", verifyToken, getDriverProfile);
router.put("/drivers/profile", verifyToken, updateDriverProfile);

export default router;
