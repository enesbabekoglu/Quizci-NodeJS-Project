import Quiz from "../models/Quiz.js";

// Quiz oluştur (sadece moderator)
export const createQuiz = async (req, res) => {
  try {
    if (req.user.role !== "moderator") {
      return res.status(403).json({ error: "Sadece moderatör quiz oluşturabilir!" });
    }
    const { title, questions } = req.body;
    const quiz = await Quiz.create({ title, questions, owner: req.user.userId });
    res.status(201).json({ quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tüm quizleri (veya sadece sahibini) listele
export const listQuizzes = async (req, res) => {
  // Sadece moderatör kendi quizlerini görebilir
  const quizzes = await Quiz.find({ owner: req.user.userId });
  res.json({ quizzes });
};
