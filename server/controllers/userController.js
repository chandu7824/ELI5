const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const getUserProfile = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { passwordHash: 0 } } // Exclude password
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;

    const posts = await db
      .collection("posts")
      .find({ authorId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ posts });
  } catch (error) {
    console.error("Error in getUserPosts:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserComments = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;

    const comments = await db
      .collection("comments")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    res.json({ comments });
  } catch (error) {
    console.error("Error in getUserComments:", error);
    res.status(500).json({ error: error.message });
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

module.exports = {
  getUserProfile,
  getUserPosts,
  getUserComments,
  getCurrentUser,
};
