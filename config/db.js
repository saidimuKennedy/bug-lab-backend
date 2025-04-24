const { Pool } = require("pg");

const pool = new Pool({
	user: "postgres",
	host: "localhost",
	database: "bugs",
	password: "",
	port: 5432,
});

module.exports = pool;
// This code creates a connection pool to a PostgreSQL database using the pg library.
// It specifies the user, host, database name, password, and port for the connection.