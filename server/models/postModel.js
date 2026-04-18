const { getDB } = require("../config/db");

const createPostsCollection = async () => {
  const db = getDB();
  const collections = await db.listCollections({ name: "posts" }).toArray();

  if (collections.length === 0) {
    await db.createCollection("posts", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["title", "description", "createdAt"],
          properties: {
            title: { bsonType: "string", minLength: 10, maxLength: 150 },
            description: { bsonType: "string", minLength: 10 },
            authorId: { bsonType: ["objectId", "null"] },
            authorName: { bsonType: "string" },
            tags: { bsonType: "array", items: { bsonType: "string" } },
            aiResponseStatus: { enum: ["pending", "generated", "failed"] },
            metrics: {
              bsonType: "object",
              properties: {
                totalAnswers: { bsonType: "int" },
                views: { bsonType: "int" },
                upvotes: { bsonType: "int" },
                downvotes: { bsonType: "int" },
              },
            },
            viewedBy: {
              bsonType: "array",
              items: { bsonType: "string" },
            },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" },
          },
        },
      },
    });

    await db
      .collection("posts")
      .createIndex({ title: "text", description: "text" });
    await db.collection("posts").createIndex({ tags: 1 });
    await db.collection("posts").createIndex({ createdAt: -1 });
    console.log("Posts collection created");
  }
};

module.exports = { createPostsCollection };
