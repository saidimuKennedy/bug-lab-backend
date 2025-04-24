const express = require("express");
const cors = require("cors");
const bugsRoutes = require("./routes/bugsRoutes");
const scientistRoutes = require("./routes/scientistRoutes");

const app = express();

// CORS middleware for routes
app.use(
	cors({
		origin: "http://localhost:5173",
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		allowedHeaders: ["Content-Type"],
	})
);

app.use(express.json());

app.use("/bugs", bugsRoutes);
app.use("/scientists", scientistRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
