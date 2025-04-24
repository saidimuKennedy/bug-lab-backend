// Import the pool from your updated db config
const { pool } = require("../config/db");

const createBug = async (req, res) => {
	let client;
	try {
		// Get client from pool
		client = await pool.connect();

		// Destructure the request body
		const { name, strength, type } = req.body;

		// Input validation
		if (!name || !strength || !type) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		// Start transaction
		await client.query("BEGIN");

		const result = await client.query(
			"INSERT INTO bugs (name, strength, type) VALUES ($1, $2, $3) RETURNING *",
			[name, strength, type]
		);

		// Commit transaction
		await client.query("COMMIT");

		// Return the result to the client
		res.status(201).json({
			message: "Bug created successfully",
			bug: result.rows[0],
		});
	} catch (error) {
		// Rollback on error
		if (client) await client.query("ROLLBACK");

		console.error("Error creating bug:", error);
		res.status(500).json({
			error: "Failed to create bug",
			details:
				process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	} finally {
		if (client) client.release();
	}
};

const getAllBugs = async (req, res) => {
	let client;
	try {
		client = await pool.connect();
		const result = await client.query("SELECT * FROM bugs");
		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching bugs:", error);
		res.status(500).json({
			error: "Failed to fetch bugs",
			details:
				process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	} finally {
		if (client) client.release();
	}
};

const getBugById = async (req, res) => {
	let client;
	try {
		const { id } = req.params;

		// Validate id is a number
		if (isNaN(parseInt(id))) {
			return res.status(400).json({ error: "Invalid bug ID" });
		}

		client = await pool.connect();
		const result = await client.query("SELECT * FROM bugs WHERE id = $1", [id]);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Bug not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (error) {
		console.error("Error fetching bug:", error);
		res.status(500).json({
			error: "Failed to fetch bug",
			details:
				process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	} finally {
		if (client) client.release();
	}
};

const updateBug = async (req, res) => {
	let client;
	try {
		const { id } = req.params;
		const { name, strength, type } = req.body;

		// Validate id is a number
		if (isNaN(parseInt(id))) {
			return res.status(400).json({ error: "Invalid bug ID" });
		}

		// Validate required fields
		if (!name || !strength || !type) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		client = await pool.connect();

		// Start transaction
		await client.query("BEGIN");

		// First check if bug exists
		const bugCheck = await client.query("SELECT id FROM bugs WHERE id = $1", [
			id,
		]);

		if (bugCheck.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({ message: "Bug not found" });
		}

		const result = await client.query(
			"UPDATE bugs SET name = $1, strength = $2, type = $3 WHERE id = $4 RETURNING *",
			[name, strength, type, id]
		);

		// Commit transaction
		await client.query("COMMIT");

		res.status(200).json({
			message: "Bug updated successfully",
			bug: result.rows[0],
		});
	} catch (error) {
		// Rollback on error
		if (client) await client.query("ROLLBACK");

		console.error("Error updating bug:", error);
		res.status(500).json({
			error: "Failed to update bug",
			details:
				process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	} finally {
		if (client) client.release();
	}
};

const deleteBug = async (req, res) => {
	let client;
	try {
		const { id } = req.params;

		// Validate id is a number
		if (isNaN(parseInt(id))) {
			return res.status(400).json({ error: "Invalid bug ID" });
		}

		client = await pool.connect();

		// Start transaction
		await client.query("BEGIN");

		// Check if bug exists
		const bugCheck = await client.query("SELECT id FROM bugs WHERE id = $1", [
			id,
		]);

		if (bugCheck.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({ message: "Bug not found" });
		}

		// First remove any assignments of this bug to scientists
		await client.query("DELETE FROM scientist_bugs WHERE bug_id = $1", [id]);

		// Then delete the bug
		const result = await client.query(
			"DELETE FROM bugs WHERE id = $1 RETURNING *",
			[id]
		);

		// Commit transaction
		await client.query("COMMIT");

		res.status(200).json({
			message: "Bug deleted successfully",
			bug: result.rows[0],
		});
	} catch (error) {
		// Rollback on error
		if (client) await client.query("ROLLBACK");

		console.error("Error deleting bug:", error);
		res.status(500).json({
			error: "Failed to delete bug",
			details:
				process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	} finally {
		if (client) client.release();
	}
};

module.exports = {
	createBug,
	getAllBugs,
	getBugById,
	updateBug,
	deleteBug,
};
