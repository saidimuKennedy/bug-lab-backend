// db.js
const { Pool } = require("pg");
require("dotenv").config();

// Create connection pool with DATABASE_URL or individual params
const pool = new Pool(
	process.env.DATABASE_URL
		? {
				connectionString: process.env.DATABASE_URL,
				ssl: {
					rejectUnauthorized: false,
				},
		  }
		: {
				user: process.env.DB_USER,
				host: process.env.DB_HOST,
				database: process.env.DB_NAME,
				password: process.env.DB_PASSWORD,
				port: parseInt(process.env.DB_PORT || "5432"),
				max: parseInt(process.env.DB_POOL_MAX || "20"),
				idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
				connectionTimeoutMillis: parseInt(
					process.env.DB_CONNECTION_TIMEOUT || "5000"
				),
				ssl:
					process.env.DB_SSL === "true"
						? {
								rejectUnauthorized:
									process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
						  }
						: false,
		  }
);

// Event handlers for the pool
pool.on("connect", () => {
	console.log("Database connection established");
});

pool.on("error", (err) => {
	console.error("Unexpected error on idle client", err);
	process.exit(-1);
});

// Simple test query function
const testConnection = async () => {
	try {
		const client = await pool.connect();
		const result = await client.query("SELECT NOW()");
		client.release();
		console.log("Database connection test successful:", result.rows[0]);
		return true;
	} catch (err) {
		console.error("Database connection test failed:", err);
		return false;
	}
};

module.exports = {
	pool,
	testConnection,
};
