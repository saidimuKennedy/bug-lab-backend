const bcrypt = require("bcrypt");
const { findUserByEmail, findUserById } = require("../services/users");
const prisma = require("../config/prismaClient");

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
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUserAndScientist = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: email },
      });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const newUser = await tx.user.create({
        data: {
          email,
          hashed_password: hashedPassword,
        },
        select: { id: true, email: true },
      });

      const newScientist = await tx.scientist.create({
        data: {
          name,
          email,
          user: {
            connect: { id: newUser.id },
          },
        },
        select: { id: true, name: true },
      });
      return { newUser, newScientist };
    });

    res.status(201).json({
      id: newUserAndScientist.newUser.id,
      email: newUserAndScientist.newUser.email,
      name: newUserAndScientist.newScientist.name,
    });
  } catch (err) {
    console.error("Error in registration controller:", err);
    if (err.message === "User with this email already exists") {
      return res.status(409).json({ message: err.message });
    }
    if (err.code === "P2002") {
      // Prisma's unique constraint violation error code
      if (err.meta.target.includes("email")) {
        // Check which unique constraint was violated
        return res
          .status(409)
          .json({ message: "A profile with this email already exists" });
      }
    }
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
