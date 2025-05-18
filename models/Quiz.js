import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options:      [{ type: String, required: true }],
  correctIndex: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  questions:[questionSchema],
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt:{ type: Date, default: Date.now }
});

export default mongoose.model("Quiz", quizSchema);
