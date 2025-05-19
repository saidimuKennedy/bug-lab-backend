const bcrypt = require("bcrypt");
const { pool } = require("../config/db");

async function findUserById(userId) {
  try {
    const result = await pool.query(
      "SELECT u.id, u.email, u.hashed_password, s.name AS scientist_name FROM public.users u LEFT JOIN public.scientist s ON u.id = s.user_id WHERE u.id = $1",
      [userId]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        hashed_password: user.hashed_password,
        name: user.scientist_name || user.email,
      };
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
}

async function findUserByEmail(email) {
  try {
    const result = await pool.query(
      "SELECT id, email, hashed_password FROM public.users WHERE email = $1",
      [email]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return user;
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
}

const authenticate = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await findUserById(req.session.userId);
      if (user) {
        req.user = user;
        next();
      } else {
        req.session.destroy((err) => {
          if (err) console.error("Error destroying session:", err);
          res.status(401).json({ message: "Not authenticated" });
        });
      }
    } catch (err) {
      res.status(500).json({
        message: "Internal server error during authentication check",
      });
    }
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user.id;

    res.status(200).json({
      id: user.id,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during login" });
  }
};

const getCurrentUser = async (req, res) => {
  if (req.user) {
    res.status(200).json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    });
  } else {
    res
      .status(401)
      .json({ message: "User data not available or not authenticated" });
  }
};

const logoutUser = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email, and password are required for registration",
    });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        "INSERT INTO public.users (email, hashed_password) VALUES ($1, $2) RETURNING id, email",
        [email, hashedPassword]
      );
      const newUser = userResult.rows[0];

      const scientistResult = await client.query(
        "INSERT INTO public.scientist (name, email, user_id) VALUES ($1, $2, $3) RETURNING id, name",
        [name, email, newUser.id]
      );
      const newScientist = scientistResult.rows[0];

      await client.query("COMMIT");
      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        name: newScientist.name,
      });
    } catch (transactionError) {
      await client.query("ROLLBACK");
      console.error(
        "Transaction failed during registration:",
        transactionError
      );

      if (transactionError.constraint === "scientist_email_key") {
        return res.status(409).json({
          message: "Scientist profile with this email already exists",
        });
      }
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error in registration controller:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

module.exports = {
  loginUser,
  getCurrentUser,
  logoutUser,
  registerUser,
  authenticate,
};
