const pool = require("../config/db");
const { haveSameValues } = require("../utils/helpers");
const submitContestCustomValidator = async (req, res, next) => {
  const userId = req.user.user_id;
  const { contest_played_id, answers } = req.body;

  // Check if contest_played_id is provided of logged in user
  const [rows] = await pool.execute(
    `select * from contest_played where contest_played_id=? and user_id=? and deleted=0`,
    [contest_played_id, userId]
  );

  if (rows.length === 0) {
    return res.status(400).json({
      success: false,
      message:
        "Contest played ID is invalid or trying to submit of another user",
    });
  }

  const contestId = rows[0].contest_id;

  const [questionIds] = await pool.execute(
    `select question_id from questions where contest_id=? and deleted=0`,
    [contestId]
  );

  const originalQuestionIds = questionIds.map((q) => q.question_id);
  const originalQuestionIdsSet = [...new Set(originalQuestionIds)];

  const inputQuestionIds = answers.map((a) => a.question_id);
  const inputQuestionIdsSet = [...new Set(inputQuestionIds)];

  console.log("inputQuestionIdsSet", inputQuestionIdsSet);
  console.log("originalQuestionIdsSet", originalQuestionIdsSet);

  // check if question ids in answers array are unique
  if (inputQuestionIds.length !== inputQuestionIdsSet.length) {
    return res.status(400).json({
      success: false,
      message: "Question IDs in answers array must be unique",
    });
  }

  // check if question ids in answers array are present in contest
  if (!haveSameValues(originalQuestionIdsSet, inputQuestionIdsSet)) {
    return res.status(400).json({
      success: false,
      message:
        "Question IDs of contest not present in answers array. Expected: [" +
        originalQuestionIdsSet +
        "] provided: [" +
        inputQuestionIdsSet +
        "]",
    });
  }

  next();
};
module.exports = submitContestCustomValidator;
