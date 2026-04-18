const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const getDashboardStats = async (req, res) => {
  try {
    const db = getDB();

    const totalUsers = await db.collection("users").countDocuments();
    const totalAdmins = await db
      .collection("users")
      .countDocuments({ role: "admin" });
    const totalPosts = await db.collection("posts").countDocuments();
    const totalComments = await db.collection("comments").countDocuments();
    const totalVotes = await db.collection("votes").countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = await db.collection("users").countDocuments({
      createdAt: { $gte: today },
    });

    const newPostsToday = await db.collection("posts").countDocuments({
      createdAt: { $gte: today },
    });

    const newCommentsToday = await db.collection("comments").countDocuments({
      createdAt: { $gte: today },
    });

    const recentPosts = await db
      .collection("posts")
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const recentUsers = await db
      .collection("users")
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const topPosts = await db
      .collection("posts")
      .find()
      .sort({ "metrics.views": -1 })
      .limit(5)
      .toArray();

    const topUsers = await db
      .collection("users")
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ "stats.reputationScore": -1 })
      .limit(5)
      .toArray();

    const postsByDay = await db
      .collection("posts")
      .aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 7 },
      ])
      .toArray();

    res.json({
      stats: {
        totalUsers,
        totalAdmins,
        totalPosts,
        totalComments,
        totalVotes,
        newUsersToday,
        newPostsToday,
        newCommentsToday,
      },
      recentPosts,
      recentUsers,
      topPosts,
      topUsers,
      postsByDay,
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, search = "", role = "all" } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (role !== "all") {
      query.role = role;
    }

    const users = await db
      .collection("users")
      .find(query)
      .project({ passwordHash: 0 })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection("users").countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;

    const userPosts = await db
      .collection("posts")
      .find({ authorId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const userComments = await db
      .collection("comments")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const userVotes = await db
      .collection("votes")
      .find({ userId: new ObjectId(userId) })
      .count();

    res.json({
      posts: userPosts,
      comments: userComments,
      totalVotes: userVotes,
      totalPosts: userPosts.length,
      totalComments: userComments.length,
    });
  } catch (error) {
    console.error("Error in getUserActivity:", error);
    res.status(500).json({ error: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const db = getDB();
    const { email, username, password } = req.body;

    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email or username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = {
      username,
      email,
      passwordHash,
      profile: { avatar: "", bio: "Platform Administrator" },
      stats: { totalQuestions: 0, totalAnswers: 0, reputationScore: 100 },
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newAdmin);

    res.status(201).json({
      message: "New admin created successfully",
      user: {
        id: result.insertedId,
        username,
        email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Error in createAdmin:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const { role } = req.body;

    const adminCount = await db
      .collection("users")
      .countDocuments({ role: "admin" });

    if (role !== "admin" && adminCount <= 1) {
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      if (user.role === "admin") {
        return res.status(400).json({ error: "Cannot remove the last admin" });
      }
    }

    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { role, updatedAt: new Date() } }
      );

    res.json({ message: `User role updated to ${role}` });
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "admin") {
      const adminCount = await db
        .collection("users")
        .countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last admin" });
      }
    }

    await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
    await db.collection("posts").deleteMany({ authorId: new ObjectId(userId) });
    await db
      .collection("comments")
      .deleteMany({ userId: new ObjectId(userId) });
    await db.collection("votes").deleteMany({ userId: new ObjectId(userId) });

    res.json({ message: "User and all associated data deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, status = "all" } = req.query;

    let query = {};
    if (status === "with-ai") query = { aiResponseStatus: "generated" };
    if (status === "without-ai") query = { aiResponseStatus: "pending" };
    if (status === "failed") query = { aiResponseStatus: "failed" };

    const posts = await db
      .collection("posts")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        let author = null;
        if (post.authorId) {
          author = await db
            .collection("users")
            .findOne({ _id: post.authorId }, { projection: { username: 1 } });
        }
        return {
          ...post,
          author: author || { username: post.authorName || "Anonymous" },
        };
      })
    );

    const total = await db.collection("posts").countDocuments(query);

    res.json({
      posts: postsWithAuthors,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error in getAllPosts:", error);
    res.status(500).json({ error: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const db = getDB();
    const { postId } = req.params;

    await db.collection("posts").deleteOne({ _id: new ObjectId(postId) });
    await db
      .collection("comments")
      .deleteMany({ postId: new ObjectId(postId) });
    await db
      .collection("votes")
      .deleteMany({ targetId: new ObjectId(postId), targetType: "post" });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost:", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllComments = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20 } = req.query;

    const comments = await db
      .collection("comments")
      .find()
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection("comments").countDocuments();

    res.json({
      comments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error in getAllComments:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const db = getDB();
    const { commentId } = req.params;

    await db.collection("comments").deleteOne({ _id: new ObjectId(commentId) });
    await db
      .collection("votes")
      .deleteMany({ targetId: new ObjectId(commentId), targetType: "comment" });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error in deleteComment:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserActivity,
  createAdmin,
  updateUserRole,
  deleteUser,
  getAllPosts,
  deletePost,
  getAllComments,
  deleteComment,
};
