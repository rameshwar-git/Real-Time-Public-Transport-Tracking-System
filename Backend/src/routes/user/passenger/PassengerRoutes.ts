import express from "express";
import { createPassenger, validateLogin,validateUser, getPassenger } from "@/controllers/user/PassengerController";

const router = express.Router();

//use passenger route to create new passenger
router.post("/passengers", createPassenger);
router.post("/login", validateLogin);
router.get("/passenger/:userId",getPassenger);
router.get("/validate/:_id", validateUser);

export default router;
