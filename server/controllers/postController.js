const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { generateAIResponse } = require("../services/aiService");

const createPost = async (req, res) => {
  try {
    const db = getDB();
    const { title, description, tags } = req.body;

    let userId = null;
    if (req.user) {
      userId = new ObjectId(req.user.id);
    }

    const newPost = {
      title,
      description,
      tags: tags || [],
      authorId: userId,
      authorName: req.user ? req.user.username : "Anonymous",
      aiResponseStatus: "pending",
      metrics: { totalAnswers: 0, views: 0, upvotes: 0, downvotes: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("posts").insertOne(newPost);
    const postId = result.insertedId;

    // Update user stats if logged in
    if (userId) {
      await db
        .collection("users")
        .updateOne({ _id: userId }, { $inc: { "stats.totalQuestions": 1 } });
    }

    // Generate AI response as first comment
    generateAIResponse(postId, description);

    res.status(201).json({ message: "Post created", postId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const post = await db
      .collection("posts")
      .findOne({ _id: new ObjectId(id) });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Track unique view using a Set in memory (simpler but resets on server restart)
    // For production, use the database approach above

    // Simple approach: track views in post document
    const userId = req.user ? req.user.id : null;
    const sessionId = userId || req.headers["x-session-id"] || req.ip;

    // Check if this user/session has already viewed
    const viewedBy = post.viewedBy || [];
    const hasViewed = viewedBy.includes(sessionId);

    if (!hasViewed) {
      // Add to viewed array and increment count
      await db.collection("posts").updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: { "metrics.views": 1 },
          $push: { viewedBy: sessionId },
        }
      );
      post.metrics.views = (post.metrics.views || 0) + 1;
    }

    res.json(post);
  } catch (error) {
    console.error("Error in getPostById:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createPost, getPostById };
