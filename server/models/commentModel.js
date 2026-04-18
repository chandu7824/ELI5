const { getDB } = require("../config/db");

const createCommentsCollection = async () => {
  const db = getDB();
  const collections = await db.listCollections({ name: "comments" }).toArray();

  if (collections.length === 0) {
    await db.createCollection("comments", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["postId", "content", "isAI", "createdAt"],
          properties: {
            postId: { bsonType: "objectId" },
            userId: { bsonType: ["objectId", "null"] },
            authorName: { bsonType: "string" },
            content: { bsonType: "string", minLength: 1 },
            isAI: { bsonType: "bool" },
            parentId: { bsonType: ["objectId", "null"] },
            mentions: { bsonType: "array", items: { bsonType: "objectId" } },
            metrics: {
              bsonType: "object",
              properties: {
                upvotes: { bsonType: "int" },
                downvotes: { bsonType: "int" },
              },
            },
            isAccepted: { bsonType: "bool" },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" },
          },
        },
      },
    });

    await db.collection("comments").createIndex({ postId: 1 });
    await db.collection("comments").createIndex({ parentId: 1 });
    await db.collection("comments").createIndex({ createdAt: -1 });
    console.log("Comments collection created");
  }
};

module.exports = { createCommentsCollection };
