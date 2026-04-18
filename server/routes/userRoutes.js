const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  getUserPosts,
  getUserComments,
  getCurrentUser,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

router.get("/:userId", authenticate, getUserProfile);
router.get("/:userId/posts", authenticate, getUserPosts);
router.get("/:userId/comments", authenticate, getUserComments);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
