const { getDB } = require("../config/db");

const createUserCollection = async () => {
  const db = getDB();
  const collections = await db.listCollections({ name: "users" }).toArray();

  if (collections.length === 0) {
    await db.createCollection("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["username", "email", "passwordHash", "createdAt"],
          properties: {
            username: { bsonType: "string", minLength: 3 },
            email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
            passwordHash: { bsonType: "string" },
            profile: {
              bsonType: "object",
              properties: {
                avatar: { bsonType: "string" },
                bio: { bsonType: "string" },
              },
            },
            stats: {
              bsonType: "object",
              properties: {
                totalQuestions: { bsonType: "int" },
                totalAnswers: { bsonType: "int" },
                reputationScore: { bsonType: "int" },
              },
            },
            role: { enum: ["user", "admin"] },
            isActive: { bsonType: "bool" },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" },
          },
        },
      },
    });

    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    console.log("Users collection created");
  }
};

module.exports = { createUserCollection };
