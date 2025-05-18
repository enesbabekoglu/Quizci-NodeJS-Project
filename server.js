import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/room.js";
import quizRoutes from "./routes/quiz.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
connectDB();

// Test için ana rota (isteğe bağlı)
// app.get("/", (req, res) => res.send("API Çalışıyor!"));
app.get("/", (req, res) => {
    console.log("Ana rota tetiklendi!");
    res.send("API Çalışıyor!");
  });
  
app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/quiz", quizRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});