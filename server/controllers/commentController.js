const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { extractMentions } = require("../utils/mentionParser");
const { createNotification } = require("../services/notificationService");

let ioInstance = null;

const setCommentIO = (io) => {
  ioInstance = io;
};

const addComment = async (req, res) => {
  try {
    const db = getDB();
    const { postId, content, parentId } = req.body;

    let userId = null;
    let authorName = "Anonymous";

    if (req.user) {
      userId = new ObjectId(req.user.id);
      authorName = req.user.username;
    }

    const mentions = await extractMentions(content);

    const newComment = {
      postId: new ObjectId(postId),
      userId: userId,
      authorName: authorName,
      content,
      isAI: false,
      parentId: parentId ? new ObjectId(parentId) : null,
      mentions,
      metrics: { upvotes: 0, downvotes: 0 },
      isAccepted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("comments").insertOne(newComment);
    const commentId = result.insertedId;
    newComment._id = commentId;

    for (const mentionedUserId of mentions) {
      if (mentionedUserId.toString() !== userId?.toString()) {
        await createNotification({
          recipientId: mentionedUserId,
          senderId: userId,
          type: "mention",
          reference: { postId: new ObjectId(postId), commentId },
        });
      }
    }

    if (parentId) {
      const parentComment = await db.collection("comments").findOne({
        _id: new ObjectId(parentId),
      });

      if (
        parentComment &&
        parentComment.userId &&
        parentComment.userId.toString() !== userId?.toString()
      ) {
        await createNotification({
          recipientId: parentComment.userId,
          senderId: userId,
          type: "reply",
          reference: { postId: new ObjectId(postId), commentId },
        });
      }
    }

    await db
      .collection("posts")
      .updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { "metrics.totalAnswers": 1 } }
      );

    if (userId) {
      await db
        .collection("users")
        .updateOne({ _id: userId }, { $inc: { "stats.totalAnswers": 1 } });
    }

    if (ioInstance) {
      ioInstance.to(`post_${postId}`).emit("new-user-answer", {
        postId: postId,
        comment: newComment,
      });

      const totalAnswers = await db
        .collection("comments")
        .countDocuments({ postId: new ObjectId(postId) });
      ioInstance.to(`post_${postId}`).emit("answer-count-updated", {
        postId: postId,
        totalAnswers: totalAnswers,
      });
    }

    res.status(201).json({
      message: "Comment added",
      commentId,
      comment: newComment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const db = getDB();
    const { postId } = req.params;

    const comments = await db
      .collection("comments")
      .find({ postId: new ObjectId(postId), parentId: null })
      .sort({ createdAt: 1 })
      .toArray();

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await db
          .collection("comments")
          .find({ parentId: comment._id })
          .sort({ createdAt: 1 })
          .toArray();

        return { ...comment, replies };
      })
    );

    res.json(commentsWithReplies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReplies = async (req, res) => {
  try {
    const db = getDB();
    const { commentId } = req.params;

    const replies = await db
      .collection("comments")
      .find({ parentId: new ObjectId(commentId) })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(replies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addComment, getCommentsByPost, getReplies, setCommentIO };
