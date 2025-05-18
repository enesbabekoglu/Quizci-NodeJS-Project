import Room from "../models/Room.js";
import User from "../models/User.js";

// Oda oluştur (sadece moderator)
export const createRoom = async (req, res) => {
  try {
    // Token ile gelen kullanıcı moderator olmalı
    if (req.user.role !== "moderator") return res.status(403).json({ error: "Sadece moderatör oda oluşturabilir!" });

    const { name } = req.body;
    const room = await Room.create({ name, moderator: req.user.userId, players: [req.user.userId] });
    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Oda listele (herkes görebilir)
export const listRooms = async (req, res) => {
  const rooms = await Room.find().populate("moderator", "username").select("name status moderator");
  res.json({ rooms });
};

// Odaya katıl (player)
export const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Oda bulunamadı." });

    // Eğer zaten oyuncular arasında varsa tekrar ekleme
    if (room.players.includes(req.user.userId)) {
      return res.status(400).json({ error: "Zaten bu odadasın!" });
    }

    room.players.push(req.user.userId);
    await room.save();

    res.json({ message: "Odaya katıldın.", room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
