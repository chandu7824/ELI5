const express = require("express");
const router = express.Router();
const { getFeed, getOnlineCount } = require("../controllers/feedController");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, getFeed);
router.get("/online-count", getOnlineCount);

module.exports = router;
