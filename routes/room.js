import express from "express";
import { createRoom, listRooms, joinRoom } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createRoom);         // Oda oluştur (moderator)
router.get("/list", protect, listRooms);             // Oda listele (herkes)
router.post("/:id/join", protect, joinRoom);         // Odaya katıl (player/moderator)

export default router;
