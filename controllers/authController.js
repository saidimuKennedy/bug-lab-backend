const bcrypt = require("bcrypt");

const { pool } = require("../config/db");

async function findUserById(userId) {
  console.log("Fetching user from DB for ID:", userId);
  try {
    const result = await pool.query(
      "SELECT u.id, u.email, u.hashed_password, s.name AS scientist_name FROM public.users u LEFT JOIN public.scientist s ON u.id = s.user_id WHERE u.id = $1",
      [userId]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("User found by ID:", user.email);
      return {
        id: user.id,
        email: user.email,
        hashed_password: user.hashed_password,
        name: user.scientist_name || user.email,
      };
    } else {
      console.log("No user found for ID:", userId);
      return null;
    }
  } catch (err) {
    console.error("Error finding user by ID in DB:", err);
    throw err;
  }
}

async function findUserByEmail(email) {
  console.log("Fetching user from DB for email:", email);
  try {
    const result = await pool.query(
      "SELECT id, email, hashed_password FROM public.users WHERE email = $1",
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("User found by email:", user.email);
      return user;
    } else {
      console.log("No user found for email:", email);
      return null;
    }
  } catch (err) {
    console.error("Error finding user by email in DB:", err);
    throw err;
  }
}

const authenticate = async (req, res, next) => {
  console.log("Auth Middleware: Checking session...");

  if (req.session && req.session.userId) {
    console.log("Session userId found:", req.session.userId);
    try {
      const user = await findUserById(req.session.userId);

      if (user) {
        req.user = user;
        console.log("Authentication successful for user:", user.email);
        next();
      } else {
        console.log(
          "Session userId found, but user not found in DB. Clearing session."
        );
        req.session.destroy((err) => {
          if (err) console.error("Error destroying session:", err);
          res.status(401).json({ message: "Not authenticated" });
        });
      }
    } catch (err) {
      console.error("Error in authenticate middleware DB call:", err);
      res
        .status(500)
        .json({ message: "Internal server error during authentication check" });
    }
  } else {
    console.log("No session userId found. Not authenticated.");
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
      console.log("Login failed: User not found for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);

    if (!isMatch) {
      console.log("Login failed: Password mismatch for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user.id;

    console.log("Login successful for user ID:", user.id);

    res.status(200).json({
      id: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error("Error during login process:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

const getCurrentUser = async (req, res) => {
  console.log("getCurrentUser controller reached.");
  if (req.user) {
    console.log("Authenticated user found in req.user:", req.user.email);

    res.status(200).json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    });
  } else {
    console.log(
      "getCurrentUser controller reached without req.user. Sending 401."
    );
    res
      .status(401)
      .json({ message: "User data not available or not authenticated" });
  }
};

const logoutUser = async (req, res) => {
  console.log("logoutUser controller reached.");

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);

      return res.status(500).json({ message: "Could not log out" });
    }
    res.clearCookie("connect.sid");

    console.log("User logged out (session destroyed)");
    res.status(200).json({ message: "Logged out successfully" });
  });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
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
      console.log(
        "Registration failed: User with email already exists:",
        email
      );
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    // 2. Hash the password securely
    const saltRounds = 10; // Recommended salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Password hashed successfully.");

    // Start a transaction to ensure both user and scientist records are created or neither are
    const client = await pool.connect(); // Get a client from the pool
    try {
      await client.query("BEGIN"); // Start the transaction

      // 3. Insert the new user into the users table
      // Use RETURNING id, email to get the data back from the insert
      const userResult = await client.query(
        "INSERT INTO public.users (email, hashed_password) VALUES ($1, $2) RETURNING id, email",
        [email, hashedPassword]
      );
      const newUser = userResult.rows[0];
      console.log("New user inserted:", newUser.email, "ID:", newUser.id);

      const scientistResult = await client.query(
        "INSERT INTO public.scientist (name, email, user_id) VALUES ($1, $2, $3) RETURNING id, name",
        [name, email, newUser.id]
      );
      const newScientist = scientistResult.rows[0];
      console.log(
        "Linked scientist profile created:",
        newScientist.name,
        "ID:",
        newScientist.id
      );

      await client.query("COMMIT"); // Commit the transaction if both inserts succeeded

      // 5. Optionally log the user in automatically after registration
      // This is a common pattern, but requires managing the session here
      // req.session.userId = newUser.id; // If you want auto-login

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
