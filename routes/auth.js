import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", (req, res, next) => {
    console.log("Register endpoint çağrıldı");
    next();
  }, register);
  
router.post("/login", login);

export default router;
