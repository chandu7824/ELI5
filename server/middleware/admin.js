const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const db = getDB();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(req.user.id) });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { isAdmin };
