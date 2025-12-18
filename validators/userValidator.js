const { query } = require("express-validator");

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
exports.contestsHistoryValidator = [
  query("status")
    .optional()
    .isIn(["completed", "inprogress"])
    .withMessage("Invalid status"),
  ...paginParamsValidator,
];

exports.getPrizesWonValidator = [...paginParamsValidator];
