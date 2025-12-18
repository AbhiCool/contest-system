const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const isUserAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first to access this resource",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await pool.execute(
      "SELECT user_id, username, email, role FROM users WHERE user_id = ? AND deleted = 0",
      [decodedToken.id]
    );
    req.user = user[0];

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Please login first to access this resource",
    });
  }
};

module.exports = isUserAuthenticated;
