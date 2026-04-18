const express = require("express");
const router = express.Router();
const { vote } = require("../controllers/voteController");
const { authenticate, requireAuth } = require("../middleware/auth");

router.post("/", authenticate, requireAuth, vote);

module.exports = router;
