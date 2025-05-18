import express from "express";
import { createQuiz, listQuizzes } from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createQuiz);   // Quiz oluştur
router.get("/list", protect, listQuizzes);     // Kendi quizlerini listele

export default router;
