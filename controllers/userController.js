const pool = require("../config/db");
exports.getUserContestsHistory = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    console.log("userid", userId);

    const status = req.query.status;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    // console.log("status", status);

    let compltetionStatus = `and contest_played.isCompleted in (0,1)`;

    if (status) {
      if (status === "completed") {
        compltetionStatus = `and contest_played.isCompleted = 1`;
      }
      if (status === "inprogress") {
        compltetionStatus = `and contest_played.isCompleted = 0`;
      }
    }

    const query = `SELECT COUNT(*) as total 
    FROM contest_played
      INNER JOIN users
        ON users.user_id = contest_played.user_id
       AND users.deleted = 0
      INNER JOIN contests
        ON contests.contest_id = contest_played.contest_id
       AND contests.deleted = 0
      WHERE contest_played.user_id = ?
        AND contest_played.deleted = 0 ${compltetionStatus}`;

    const [countRows] = await pool.execute(query, [userId]);

    const [rows] = await pool.execute(
      `
      SELECT 
        contests.contest_id,
        contests.contest_name,
        contests.description,
        contests.startDate,
        contests.endDate,
        contests.prize_information,
        contests.access_level,
        contest_played.isCompleted,
        contest_played.score
      FROM contest_played
      INNER JOIN users 
        ON users.user_id = contest_played.user_id 
       AND users.deleted = 0
      INNER JOIN contests 
        ON contests.contest_id = contest_played.contest_id 
       AND contests.deleted = 0
      WHERE contest_played.user_id = ?
        AND contest_played.deleted = 0 ${compltetionStatus}
      ORDER BY contest_played.updated_at DESC 
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
      `,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "User contests history fetched successfully",
      totalRecords: countRows[0].total,
      page,
      limit,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPrizesWon = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const limit = req.query.limit || 10;
    const page = req.query.page || 1;

    const query = `select
        count(*) as total
        from 
        contest_played        
        inner join contests on contest_played.contest_id = contests.contest_id and contest_played.deleted = 0
        inner join 
        (select 
        contest_played.contest_id,
        max(contest_played.score) as max_score           
        from contest_played 
        where contest_played.deleted = 0
        group by contest_id) t1 on contests.contest_id = t1.contest_id
        where contest_played.user_id = ? and contest_played.score = t1.max_score;`;

    const [countRows] = await pool.execute(query, [userId]);

    const [rows] = await pool.execute(
      `select
        contest_played.user_id,
        contests.*,
        contest_played.score,
        t1.max_score
        from 
        contest_played
        

        inner join contests on contest_played.contest_id = contests.contest_id and contest_played.deleted = 0

        inner join 
        (select 
        contest_played.contest_id,
        max(contest_played.score) as max_score
            
        from contest_played 
        where contest_played.deleted = 0
        group by contest_id) t1 on contests.contest_id = t1.contest_id

        where contest_played.user_id = ? and contest_played.score = t1.max_score;`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Won user prizes fetched successfully",
      totalRecords: countRows[0].total,
      page,
      limit,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};
