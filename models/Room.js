import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name:         { type: String, required: true },         // Oda adı
  moderator:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Odayı kuran
  players:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Yarışmacılar
  quiz:         { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },  // Bu odada oynanacak quiz (ileride)
  status:       { type: String, enum: ["waiting", "started", "finished"], default: "waiting" }, // Oda durumu
  createdAt:    { type: Date, default: Date.now }
});

export default mongoose.model("Room", roomSchema);
