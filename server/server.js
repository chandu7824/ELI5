const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { connectDB, getDB } = require("./config/db");

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

let activeConnections = 0;

const { setIO } = require("./services/aiService");
setIO(io);

const { setCommentIO } = require("./controllers/commentController");
setCommentIO(io);

io.on("connection", (socket) => {
  activeConnections++;
  io.emit("online-count", activeConnections);
  console.log(`User connected. Total active: ${activeConnections}`);

  socket.on("join-post", (postId) => {
    if (postId) {
      socket.join(`post_${postId}`);
      console.log(`Socket ${socket.id} joined post room: ${postId}`);
    }
  });

  socket.on("leave-post", (postId) => {
    if (postId) {
      socket.leave(`post_${postId}`);
      console.log(`Socket ${socket.id} left post room: ${postId}`);
    }
  });

  socket.on("disconnect", () => {
    activeConnections--;
    io.emit("online-count", activeConnections);
    console.log(`User disconnected. Total active: ${activeConnections}`);
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/votes", require("./routes/voteRoutes"));
app.use("/api/feed", require("./routes/feedRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

const initDB = async () => {
  try {
    await connectDB();
    const db = getDB();

    const { createUserCollection } = require("./models/userModel");
    const { createPostsCollection } = require("./models/postModel");
    const { createCommentsCollection } = require("./models/commentModel");
    const { createVotesCollection } = require("./models/voteModel");
    const {
      createNotificationsCollection,
    } = require("./models/notificationModel");

    await createUserCollection();
    await createPostsCollection();
    await createCommentsCollection();
    await createVotesCollection();
    await createNotificationsCollection();

    console.log("All collections ready");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
};

initDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend should be running on http://localhost:5173`);
});
