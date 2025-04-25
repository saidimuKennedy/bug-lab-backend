const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const { testConnection } = require("./config/db");

const app = express();

// Production middleware
app.use(helmet());
app.use(compression());
app.use(express.json());

// Configure CORS with specific origin
app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"https://bug-lab-frontend.vercel.app",
			"https://bug-lab-frontend-git-main.vercel.app",
			"https://bug-lab-frontend-*.vercel.app",
		],
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		optionsSuccessStatus: 200,
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

// Routes
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
