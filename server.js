// server.js
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session"); // Import express-session
// If using a database for sessions (recommended for production), import your store here, e.g:
// const MongoStore = require('connect-mongo')(session);
const { testConnection } = require("./config/db");

const authRoutes = require("./routes/authRoutes"); // Your auth routes file

const app = express();

// Production middleware
app.use(helmet());
app.use(compression());
app.use(express.json());

// --- Configure express-session Middleware ---
// In a real app, configure secret, resave, saveUninitialized, and store appropriately
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_default_secret", // Change this to a strong secret in .env
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production (requires HTTPS)
      maxAge: 1000 * 60 * 60 * 24, // Session max age in milliseconds (e.g., 24 hours)
      // httpOnly: true // Recommended: cookie accessible only by web server
    },
    // Add a store here for production:
    // store: new MongoStore({ mongoUrl: process.env.DB_URI })
  })
);
// --- End express-session Configuration ---

// Configure CORS with specific origin
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://bug-lab-frontend.vercel.app",
      "https://bug-lab-frontend-1qz449m3d-saidimukennedys-projects.vercel.app",
      // Ensure you include the EXACT origin your frontend runs on
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
    credentials: true, // Keep this true for cookies/sessions
  })
);

// Test database connection
testConnection()
  .then((connected) => {
    if (!connected) {
      console.error("Database connection failed");
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Error testing connection:", err);
    process.exit(1);
  });

// Mount Auth Routes
app.use("/auth", authRoutes);

// Existing Routes
app.use("/scientists", require("./routes/scientistRoutes"));
app.use("/bugs", require("./routes/bugsRoutes"));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
