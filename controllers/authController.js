const pool = require("../config/db");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const cookieOptions = {
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none",
  secure: true,
};
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [userRows] = await pool.execute(
      "SELECT user_id, username, email, password FROM users WHERE email = ?",
      [email]
    );

    const user = userRows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    delete user.password;

    const token = setCookie(res, user);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const [userRows] = await pool.execute(
      "SELECT user_id, username, email, password, role FROM users WHERE email = ? AND deleted = 0",
      [email]
    );

    const user = userRows[0];

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const [newUserRows] = await pool.execute(
      "insert into users (username, email, password, role) values(?, ?, ?, ?)",
      [username, email, await bcrypt.hash(password, 10), role]
    );

    const newUser = {
      user_id: newUserRows.insertId,
      username,
      email,
      role,
    };

    const token = setCookie(res, newUser);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.clearCookie("token", cookieOptions);

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

function setCookie(res, user) {
  const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET);

  res.cookie("token", token, cookieOptions);

  return token;
}
