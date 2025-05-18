import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  console.log("JWT_SECRET:", process.env.JWT_SECRET); // terminalde gözüksün
  try {
    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Bu email ile kayıtlı kullanıcı var." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed, role });
    res.status(201).json({ message: "Kayıt başarılı.", user: { id: user._id, username, email, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Kullanıcı bulunamadı." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Şifre hatalı." });

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
