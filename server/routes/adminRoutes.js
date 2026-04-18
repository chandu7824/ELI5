const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");
const {
  getDashboardStats,
  getAllUsers,
  getUserActivity,
  createAdmin,
  updateUserRole,
  deleteUser,
  getAllPosts,
  deletePost,
  getAllComments,
  deleteComment,
} = require("../controllers/adminController");

router.use(authenticate, isAdmin);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.get("/users/:userId/activity", getUserActivity);
router.post("/users/create-admin", createAdmin);
router.put("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);
router.get("/posts", getAllPosts);
router.delete("/posts/:postId", deletePost);
router.get("/comments", getAllComments);
router.delete("/comments/:commentId", deleteComment);

module.exports = router;
