const pool = require("../config/db");
const { haveSameValues } = require("../utils/helpers");
exports.getContests = async (req, res, next) => {
  try {
    const userRole = req?.user?.role || "guest";
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    let accessLevels = [];

    switch (userRole) {
      case "admin":
      case "vip":
        accessLevels = ["vip", "normal"];
        break;

      case "normal":
      case "guest":
      default:
        accessLevels = ["normal"];
        break;
    }

    // Dynamically create placeholders (?,?)
    const placeholders = accessLevels.map(() => "?").join(",");

    const query = `SELECT COUNT(*) as total
      FROM contests
      WHERE access_level IN (${placeholders})
        AND startDate <= NOW()
        AND endDate >= NOW()
        AND deleted = 0`;

    const [countRows] = await pool.execute(query, accessLevels);

    const sql = `
      SELECT *
      FROM contests
      WHERE access_level IN (${placeholders})
        AND startDate <= NOW()
        AND endDate >= NOW()
        AND deleted = 0
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;

    const [rows] = await pool.execute(sql, accessLevels);

    res.json({
      success: true,
      message: "Contests fetched successfully",
      totalRecords: countRows[0].total,
      page,
      limit,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuestions = async (req, res, next) => {
  const contestId = req.params.contestId;

  if (!contestId) {
    return res.status(400).json({ message: "Contest ID is required" });
  }

  const [rows] = await pool.execute(
    `SELECT 
    q.question_id,
    q.question,
    qt.question_type_id,
    qt.question_type,

    GROUP_CONCAT(DISTINCT o.option_id ORDER BY o.option_id SEPARATOR '|') AS option_ids,
    GROUP_CONCAT(DISTINCT o.option ORDER BY o.option_id SEPARATOR '|') AS options

    FROM contests c

    INNER JOIN questions q 
    ON c.contest_id = q.contest_id AND q.deleted = 0

    INNER JOIN question_types qt 
    ON q.question_type_id = qt.question_type_id AND qt.deleted = 0

    INNER JOIN options o 
    ON o.question_id = q.question_id AND o.deleted = 0

    WHERE c.contest_id = ?
    AND c.deleted = 0

    GROUP BY q.question_id;`,
    [contestId]
  );

  const formattedRows = rows.map((row) => {
    const optionIds = row.option_ids.split("|");
    const options = row.options.split("|");

    return {
      questionId: row.question_id,
      question: row.question,
      questionType: row.question_type,
      options: optionIds.map((id, index) => ({
        optionId: parseInt(id),
        option: options[index],
      })),
    };
  });

  res.status(200).json({
    success: true,
    message:
      formattedRows.length > 0
        ? "Questions related to contest fetched successfully"
        : "No questions found",
    data: formattedRows,
  });
};

exports.joinContest = async (req, res, next) => {
  try {
    const contestId = req.params.contestId;
    const userId = req.user.user_id;

    if (!contestId) {
      return res.status(400).json({ message: "Contest ID is required" });
    }

    let contestPlayedRows;

    [contestPlayedRows] = await pool.execute(
      `select * from contest_played where contest_id = ? and user_id = ? and deleted = 0`,
      [contestId, userId]
    );

    let rows;

    //check if trying to join completed contest
    if (contestPlayedRows.length) {
      if (contestPlayedRows[0].isCompleted) {
        return res.status(400).json({
          success: false,
          message: "You have already completed this contest",
        });
      }
    }

    if (!contestPlayedRows.length) {
      [rows] = await pool.execute(
        `insert into contest_played (contest_id, user_id) values (?, ?)`,
        [contestId, userId]
      );
    }

    res.status(200).json({
      success: true,
      message: "User joined the contest successfully",
      data: {
        contest_played_id: contestPlayedRows.length
          ? contestPlayedRows[0].contest_played_id
          : rows.insertId,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.submitContest = async (req, res, next) => {
  try {
    console.log("req.body", req.body);

    const { contest_played_id, answers } = req.body;

    if (!contest_played_id) {
      return res.status(400).json({
        success: false,
        message: "Contest played ID is required",
      });
    }

    if (!answers) {
      return res.status(400).json({
        success: false,
        message: "Answers are required",
      });
    }

    const [rows] = await pool.execute(
      `select * from contest_played where contest_played_id=? and deleted=0`,
      [contest_played_id]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Contest played ID is invalid or trying to submit without joining",
      });
    }
    if (rows.length > 0 && rows[0].isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Contest already submitted",
      });
    }

    const question_ids = answers.map((a) => a.question_id);

    const placeholders = question_ids.map(() => "?").join(",");

    const sql = `
  SELECT *
  FROM answers
  WHERE question_id IN (${placeholders})
    AND deleted = 0
`;

    const [answerRows] = await pool.execute(sql, question_ids);

    const answerMap = answerRows.reduce((map, answer) => {
      map[answer.question_id] = answer;
      return map;
    }, {});

    let score = 0;
    for (let answer of answers) {
      const [rows] = await pool.execute(
        `insert into answered_questions (contest_played_id, question_id, user_answer_ids) values (?, ?, ?)`,
        [contest_played_id, answer.question_id, answer.answer_ids]
      );

      console.log(
        answer.answer_ids,
        answerMap[answer.question_id].option_answer_ids
      );
      if (
        haveSameValues(
          answer.answer_ids,
          answerMap[answer.question_id].option_answer_ids
        )
      ) {
        score += 1;
      }
    }

    // console.log("score", score);
    // return;

    const [contestPlayedRows] = await pool.execute(
      `update contest_played set 
      
      isCompleted ='1',
      score = ?
      
      where contest_played_id = ? and deleted = 0`,
      [score, contest_played_id]
    );

    res.status(201).json({
      success: true,
      message: "Contest submitted successfully",
      data: {
        score,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getContestLeaderboard = async (req, res, next) => {
  try {
    const contestId = req.params.contestId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const query = `SELECT COUNT(*) as total
      FROM (
        select 
          DENSE_RANK() OVER (ORDER BY contest_played.score DESC) AS 'rank',
        users.user_id, 
        users.username, 
        users.email,
        contest_played.score 
        from 
        contest_played
        inner join users on contest_played.user_id = users.user_id and users.deleted = 0
        where contest_id = ? 
        and contest_played.isCompleted = 1
        and contest_played.deleted = 0 
        order by contest_played.score desc
      ) t1`;

    const [countRows] = await pool.execute(query, [contestId]);

    const [rows] = await pool.execute(
      `
      SELECT *
      FROM (
        select 
          DENSE_RANK() OVER (ORDER BY contest_played.score DESC) AS 'rank',
        users.user_id, 
        users.username, 
        users.email,
        contest_played.score 
        from 
        contest_played
        inner join users on contest_played.user_id = users.user_id and users.deleted = 0
        where contest_id = ? 
        and contest_played.isCompleted = 1
        and contest_played.deleted = 0 
        order by contest_played.score desc
      ) t1
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}  
      `,
      [contestId]
    );
    res.status(200).json({
      success: true,
      message: "Contest leaderboard fetched successfully",
      totalRecords: countRows[0].total,
      page,
      limit,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};
