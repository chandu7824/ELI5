const { connectDB, getDB } = require("./config/db");

async function checkDB() {
  await connectDB();
  const db = getDB();

  // Check collections
  const collections = await db.listCollections().toArray();
  console.log(
    "Collections:",
    collections.map((c) => c.name)
  );

  // Check posts
  const posts = await db.collection("posts").find().toArray();
  console.log("Number of posts:", posts.length);
  if (posts.length > 0) {
    console.log("Sample post:", posts[0]);
  }

  process.exit();
}

checkDB();
