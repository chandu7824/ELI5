const express = require("express");
const router = express.Router();
const {
  addComment,
  getCommentsByPost,
  getReplies,
} = require("../controllers/commentController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, addComment);
router.get("/post/:postId", authenticate, getCommentsByPost);
router.get("/replies/:commentId", authenticate, getReplies);

module.exports = router;
