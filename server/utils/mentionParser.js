const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const extractMentions = async (text) => {
  const db = getDB();
  const usernames = text.match(/@(\w+)/g)?.map((u) => u.slice(1)) || [];

  if (usernames.length === 0) return [];

  const users = await db
    .collection("users")
    .find({ username: { $in: usernames } })
    .toArray();

  return users.map((user) => user._id);
};

module.exports = { extractMentions };
