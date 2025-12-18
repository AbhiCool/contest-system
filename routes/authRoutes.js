const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  loginValidator,
  registerValidator,
} = require("../validators/authValidator");
const validate = require("../middlewares/validate");

// login route
router.post("/login", loginValidator, validate, authController.login);

// register route
router.post("/register", registerValidator, validate, authController.register);

// logout route
router.get("/logout", authController.logout);

module.exports = router;
