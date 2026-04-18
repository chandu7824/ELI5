const { getDB } = require("../config/db");

const createNotification = async ({
  recipientId,
  senderId,
  type,
  reference,
}) => {
  const db = getDB();

  await db.collection("notifications").insertOne({
    recipientId,
    senderId,
    type,
    reference,
    isRead: false,
    createdAt: new Date(),
  });
};

const getNotifications = async (userId) => {
  const db = getDB();
  return await db
    .collection("notifications")
    .find({ recipientId: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
};

const markAsRead = async (notificationId, userId) => {
  const db = getDB();
  await db
    .collection("notifications")
    .updateOne(
      { _id: new ObjectId(notificationId), recipientId: userId },
      { $set: { isRead: true } }
    );
};

module.exports = { createNotification, getNotifications, markAsRead };
