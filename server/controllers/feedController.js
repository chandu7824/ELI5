const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const getFeed = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 10, search = "" } = req.query;

    let query = {};

    // Add search functionality
    if (search && search.trim()) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
    }

    const posts = await db
      .collection("posts")
      .find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    // Get author info for each post
    const userIds = [
      ...new Set(posts.filter((p) => p.authorId).map((p) => p.authorId)),
    ];
    let userMap = new Map();

    if (userIds.length > 0) {
      const users = await db
        .collection("users")
        .find({ _id: { $in: userIds } })
        .toArray();
      userMap = new Map(users.map((u) => [u._id.toString(), u]));
    }

    const postsWithAuthors = posts.map((post) => ({
      ...post,
      author: post.authorId
        ? userMap.get(post.authorId.toString()) || {
            username: post.authorName || "Anonymous",
          }
        : { username: post.authorName || "Anonymous" },
      authorName: post.authorName || "Anonymous",
    }));

    res.json({
      posts: postsWithAuthors,
      page: parseInt(page),
      hasMore: posts.length === parseInt(limit),
    });
  } catch (error) {
    console.error("Error in getFeed:", error);
    res.status(500).json({ error: error.message });
  }
};

const getOnlineCount = async (req, res) => {
  res.json({ count: 0 });
};

module.exports = { getFeed, getOnlineCount };
