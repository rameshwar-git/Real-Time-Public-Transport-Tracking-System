import express from "express";
import { createPassenger, validateLogin, getPassenger, validateUser } from "@/controllers/user/PassengerController";
import { verifyToken } from "@/middleware/verifyToken";

const router = express.Router();

//use passenger route to create new passenger
router.post("/passengers", createPassenger);
router.post("/login", validateLogin);
router.get("/passenger/:userId",getPassenger);
router.get("/validate/:_id", validateUser);
router.post("/login", validateLogin);

router.get("/validate", verifyToken, validateUser);
router.get("/me", verifyToken, getPassenger);

export default router;
