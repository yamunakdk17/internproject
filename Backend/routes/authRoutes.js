const express = require("express");
const router = express.Router();


const authController = require("../controllers/authController");
const ratelimit = require("../middleware/ratelimit");

const loginlimiter = ratelimit({
    windowMs:15 * 60 * 1000,
    limit:10,
    message:"Too many login attempts. Please try again later."
});

router.post("/register", authController.registerUser);
router.post("/login" ,loginlimiter, authController.loginUser);

module.exports = router;