const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
// If using a database for sessions in production, import your store here, e.g:
// const PgSession = require('connect-pg-simple')(session); // For PostgreSQL

const prisma = require("./config/prismaClient");

const authRoutes = require("./routes/authRoutes");
const scientistRoutes = require("./routes/scientistRoutes");
const bugsRoutes = require("./routes/bugsRoutes");

const app = express();

// --- Production/Security Middlewares ---
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  "http://localhost:5173",
  "https://bug-lab-frontend.vercel.app",
  "https://bug-lab-frontend-1qz449m3d-saidimukennedys-projects.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
    credentials: true,
  })
);

// --- Configure express-session Middleware ---
// This middleware should come AFTER CORS if you are using credentials: true and sameSite: 'none'
// as the CORS preflight request needs to be handled first.
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "97dfd0142c9a90c358cbf6441a2940fe9f69ba480c6b762af468cfbe381c6cd5",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
    // --- IMPORTANT FOR PRODUCTION ---
    // You MUST use a persistent session store for production environments.
    // The default MemoryStore is NOT suitable for production (loses sessions on server restart, doesn't scale).
    // Example for PostgreSQL:
    // store: new PgSession({
    //   pool: require('./config/db').pool, // Assuming you keep a pg.Pool for session store
    //   tableName: 'session', // Default table name
    // }),
  })
);

// --- Database Connection Test (Prisma based) ---

(async () => {
  try {
    await prisma.$connect();
    console.log("Database connection successful with Prisma.");
  } catch (err) {
    console.error("Database connection failed with Prisma:", err);
    process.exit(1);
  } finally {
  }
})();

// --- Mount Routes ---
app.use("/auth", authRoutes);
app.use("/scientists", scientistRoutes);
app.use("/bugs", bugsRoutes);

// --- Centralized Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the stack trace for debugging
  // Send a generic error message to the client in production for security
  res
    .status(500)
    .json({ error: "An unexpected error occurred on the server." });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
