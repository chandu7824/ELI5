const express = require("express");
const router = express.Router();
const { createPost, getPostById } = require("../controllers/postController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, createPost);
router.get("/:id", authenticate, getPostById);

module.exports = router;
