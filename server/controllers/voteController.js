const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { createNotification } = require("../services/notificationService");

const vote = async (req, res) => {
  try {
    const db = getDB();
    const { targetId, targetType, voteType } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Login required to vote" });
    }

    const userId = new ObjectId(req.user.id);
    const query = {
      userId,
      targetId: new ObjectId(targetId),
      targetType,
    };

    const existingVote = await db.collection("votes").findOne(query);
    let action = "";

    if (!existingVote) {
      await db.collection("votes").insertOne({
        ...query,
        voteType,
        createdAt: new Date(),
      });
      action = "added";
    } else if (existingVote.voteType === voteType) {
      await db.collection("votes").deleteOne(query);
      action = "removed";
    } else {
      await db.collection("votes").updateOne(query, { $set: { voteType } });
      action = "updated";
    }

    const votes = await db
      .collection("votes")
      .aggregate([
        { $match: { targetId: new ObjectId(targetId), targetType } },
        {
          $group: {
            _id: null,
            upvotes: {
              $sum: { $cond: [{ $eq: ["$voteType", "upvote"] }, 1, 0] },
            },
            downvotes: {
              $sum: { $cond: [{ $eq: ["$voteType", "downvote"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    const counts = votes[0] || { upvotes: 0, downvotes: 0 };
    const collectionName = targetType === "comment" ? "comments" : "posts";

    const target = await db
      .collection(collectionName)
      .findOne({ _id: new ObjectId(targetId) });

    await db.collection(collectionName).updateOne(
      { _id: new ObjectId(targetId) },
      {
        $set: {
          "metrics.upvotes": counts.upvotes,
          "metrics.downvotes": counts.downvotes,
        },
      }
    );

    if (
      voteType === "upvote" &&
      action === "added" &&
      target &&
      target.userId &&
      target.userId.toString() !== userId.toString()
    ) {
      await createNotification({
        recipientId: target.userId,
        senderId: userId,
        type: "vote",
        reference: {
          postId:
            targetType === "post" ? new ObjectId(targetId) : target.postId,
          commentId: targetType === "comment" ? new ObjectId(targetId) : null,
        },
      });
    }

    res.json({
      message: `Vote ${action}`,
      counts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { vote };
