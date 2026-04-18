const { getDB } = require("../config/db");

const createNotificationsCollection = async () => {
  const db = getDB();
  const collections = await db
    .listCollections({ name: "notifications" })
    .toArray();

  if (collections.length === 0) {
    await db.createCollection("notifications", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["recipientId", "type", "createdAt"],
          properties: {
            recipientId: { bsonType: "objectId" },
            senderId: { bsonType: ["objectId", "null"] },
            type: { enum: ["mention", "reply", "vote"] },
            reference: {
              bsonType: "object",
              properties: {
                postId: { bsonType: "objectId" },
                commentId: { bsonType: "objectId" },
              },
            },
            isRead: { bsonType: "bool" },
            createdAt: { bsonType: "date" },
          },
        },
      },
    });

    await db
      .collection("notifications")
      .createIndex({ recipientId: 1, isRead: 1 });
    await db.collection("notifications").createIndex({ createdAt: -1 });
    console.log("Notifications collection created");
  }
};

module.exports = { createNotificationsCollection };
