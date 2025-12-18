const { body } = require("express-validator");

exports.registerValidator = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Min 3 characters"),

  body("email").isEmail().withMessage("Invalid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be 6+ chars"),

  body("role").notEmpty().withMessage("Role is required"),

  body("role")
    .isIn(["admin", "vip", "normal", "guest"])
    .withMessage("Invalid role"),
];

exports.loginValidator = [
  body("email").notEmpty().withMessage("Email is required"),

  body("email").isEmail().withMessage("Invalid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be 6+ chars"),
];
