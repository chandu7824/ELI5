const { getDB } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateTokens = (userId, username, role) => {
  const accessToken = jwt.sign(
    { id: userId, username, role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const db = getDB();
    const { username, email, password } = req.body;

    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userCount = await db.collection("users").countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    const newUser = {
      username,
      email,
      passwordHash,
      profile: { avatar: "", bio: "" },
      stats: { totalQuestions: 0, totalAnswers: 0, reputationScore: 0 },
      role: role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);
    const { accessToken, refreshToken } = generateTokens(
      result.insertedId,
      username,
      role
    );

    res.status(201).json({
      message:
        userCount === 0
          ? "Admin account created successfully"
          : "User created successfully",
      accessToken,
      refreshToken,
      user: { id: result.insertedId, username, email, role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(
      user._id,
      user.username,
      user.role
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const db = getDB();
    const user = await db.collection("users").findOne({ _id: decoded.id });

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id,
      user.username,
      user.role
    );

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const db = getDB();
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(req.user.id) },
        { projection: { passwordHash: 0 } }
      );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, refresh, getCurrentUser };
