const pool = require("../config/db");
const isContestAllowedForRole = async (req, res, next) => {
  try {
    const userRole = req?.user?.role || "guest";

    const contestId = req.params.contestId;
    // console.log("userRole", userRole);
    // console.log("contestId", contestId);

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: "Contest ID is required",
      });
    }

    const validRoles = ["admin", "vip", "normal", "guest"];

    // Check if user role is valid
    if (validRoles.indexOf(userRole) === -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const [contestRows] = await pool.execute(
      `SELECT access_level FROM contests 
      WHERE 
      contest_id = ? 
      and startDate <= NOW()
      and endDate >= NOW()
      AND deleted = 0`,
      [contestId]
    );

    if (!contestRows.length) {
      return res.status(404).json({
        status: false,
        message: "Contest not found or expired",
      });
    }

    const accessLevel = contestRows[0].access_level;

    // console.log("accessLevel", accessLevel);

    if (
      userRole === "guest" ||
      (accessLevel === "vip" && userRole === "normal")
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access the contest",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isContestAllowedForRole;
