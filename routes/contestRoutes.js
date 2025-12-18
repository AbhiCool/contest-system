const express = require("express");
const pool = require("../config/db");
const contestController = require("../controllers/contestController");

const isUserAuthenticated = require("../middlewares/isUserAuthenticated");
const isContestAllowedForRole = require("../middlewares/isContestAllowedForRole");

const {
  joinContestValidator,
  getQuestionsValidator,
  submitContestValidator,
  getContestLeaderboardValidator,
  getContestsValidator,
} = require("../validators/contestValidator");
const validate = require("../middlewares/validate");
const submitContestCustomValidator = require("../validators/submitContestCustomValidator");

const router = express.Router();

// get all contests based on user role
router.get(
  "/",
  isUserAuthenticated,
  getContestsValidator,
  validate,
  contestController.getContests
);

// join contest route
router.post(
  "/:contestId/join",
  joinContestValidator,
  validate,
  isUserAuthenticated,
  isContestAllowedForRole,
  contestController.joinContest
);

// get questions of contest route
router.get(
  "/:contestId/questions",
  getQuestionsValidator,
  validate,
  isUserAuthenticated,
  contestController.getQuestions
);

// submit contest route
router.post(
  "/:contestId/submitContest",
  submitContestValidator,
  validate,
  isUserAuthenticated,
  isContestAllowedForRole,
  submitContestCustomValidator,
  contestController.submitContest
);

// get contest leaderboard route
router.get(
  "/:contestId/leaderboard",
  getContestLeaderboardValidator,
  validate,
  isUserAuthenticated,
  isContestAllowedForRole,
  contestController.getContestLeaderboard
);

module.exports = router;
