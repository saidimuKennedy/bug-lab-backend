const pool = require("../config/db");

const createBug = async (req, res) => {
	try {
		// destructer the request body for what we need
		const { name, strength, type } = req.body;

		const result = await pool.query(
			"INSERT INTO bugs (name, strength, type) VALUES ($1, $2, $3) RETURNING *",
			[name, strength, type]
		);

		// return the result to the client
		res
			.status(201)
			.json({ message: "Bug created successfully", bug: result.rows[0] });
	} catch (error) {
		console.error("Error creating bug:", error);
		res.status(500).json({ error: error.message });
	}
};

const getAllBugs = async (req, res) => {
	try {
		const result = await pool.query("SELECT * FROM bugs");
		res.status(200).json(result.rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getBugById = async (req, res) => {
	try {
		const { id } = req.params; // we need the id from the request params
		const result = await pool.query("SELECT * FROM bugs WHERE id = $1", [id]); // get the bug by id
		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Bug not found" }); // if no bug is found, return 404
		}
		res.status(200).json(result.rows[0]); // return the bug
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const updateBug = async (req, res) => {
	try {
		const { id } = req.params; // get the id from the request params
		const { name, strength, type } = req.body; // destructer the request body for what we need
		const result = await pool.query(
			"UPDATE bugs SET name = $1, strength = $2, type = $3 WHERE id = $4 RETURNING *",
			[name, strength, type, id]
		); // we write inside the query sql statement to update the bug
		// the $1, $2, $3, $4 are placeholders for the values we pass in the array at the end of the query
		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Bug not found" }); // if no bug is found, return 404
		} // result.rows.length checks if the bug is found or not, call it an iterator
		res
			.status(200)
			.json({ message: "Bug updated successfully", bug: result.rows[0] });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const deleteBug = async (req, res) => {
	try {
		const { id } = req.params; // get the id from the request params
		const result = await pool.query(
			"DELETE FROM bugs WHERE id = $1 RETURNING *",
			[id]
		); // delete the bug by id
		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Bug not found" }); // if no bug is found, return 404
		}
		res
			.status(200)
			.json({ message: "Bug deleted successfully", bug: result.rows[0] }); // return the bug
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	createBug,
	getAllBugs,
	getBugById,
	updateBug,
	deleteBug,
};
