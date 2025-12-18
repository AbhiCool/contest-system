const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const isUserAuthenticated = require("../middlewares/isUserAuthenticated");
const validate = require("../middlewares/validate");
const {
  contestsHistoryValidator,
  getPrizesWonValidator,
} = require("../validators/userValidator");

router.get(
  "/contestsHistory",
  contestsHistoryValidator,
  validate,
  isUserAuthenticated,
  userController.getUserContestsHistory
);

router.get(
  "/prizesWon",
  getPrizesWonValidator,
  validate,
  isUserAuthenticated,
  userController.getPrizesWon
);

module.exports = router;
