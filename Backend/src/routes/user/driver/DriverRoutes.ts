import express from "express";
import { createDriver, setDriverVehicle, validateDriverLogin, validateDriver } from "@/controllers/user/DriverController";
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

export default router;
