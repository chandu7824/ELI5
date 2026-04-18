const { getDB } = require("../config/db");

const createVotesCollection = async () => {
  const db = getDB();
  const collections = await db.listCollections({ name: "votes" }).toArray();

  if (collections.length === 0) {
    await db.createCollection("votes", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "userId",
            "targetId",
            "targetType",
            "voteType",
            "createdAt",
          ],
          properties: {
            userId: { bsonType: "objectId" },
            targetId: { bsonType: "objectId" },
            targetType: { enum: ["post", "comment"] },
            voteType: { enum: ["upvote", "downvote"] },
            createdAt: { bsonType: "date" },
          },
        },
      },
    });

    await db
      .collection("votes")
      .createIndex({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
    console.log("Votes collection created");
  }
};

module.exports = { createVotesCollection };
