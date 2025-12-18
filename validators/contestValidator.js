const { body, param, query } = require("express-validator");

const commonValidator = [
  param("contestId").isInt().withMessage("contestId must be an integer"),
];

const paginParamsValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
];

exports.getContestsValidator = [...paginParamsValidator];

exports.joinContestValidator = commonValidator;

exports.getQuestionsValidator = commonValidator;

exports.getContestLeaderboardValidator = [
  ...commonValidator,
  ...paginParamsValidator,
];

exports.submitContestValidator = [
  // contest_played_id
  body("contest_played_id")
    .notEmpty()
    .withMessage("contest_played_id is required")
    .isInt()
    .withMessage("contest_played_id must be an integer"),

  // answers array
  body("answers")
    .isArray({ min: 1 })
    .withMessage("answers must be a non-empty array"),

  // each question_id
  body("answers.*.question_id")
    .notEmpty()
    .withMessage("question_id is required")
    .isInt()
    .withMessage("question_id must be an integer"),

  // answer_ids must be array
  body("answers.*.answer_ids")
    .isArray({ min: 1 })
    .withMessage("answer_ids must be a non-empty array"),

  // each answer_id inside answer_ids
  body("answers.*.answer_ids.*")
    .isInt()
    .withMessage("answer_id must be an integer"),
];
