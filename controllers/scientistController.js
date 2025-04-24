const pool = require("../config/db");

const registerScientist = async (req, res) => {
	try {
		// destructer the request body for what we need
		const { name, email, password } = req.body;

		const result = await pool.query(
			"INSERT INTO scientist (name, email, password) VALUES($1, $2, $3) RETURNING *",
			[name, email, password]
		);

		// return the result to the client
		res.status(201).json({
			message: "Scientist added successfully",
			scientist: result.rows[0],
		});
	} catch (error) {
		console.error("Error registering scientist:", error);
		res.status(500).json({ error: error.message });
	}
};

const getAllScientists = async (req, res) => {
	try {
		const result = await pool.query(`
            SELECT 
                s.id,
                s.name,
                s.email,
                s.created_at,
                COALESCE(
                    (SELECT json_agg(b.*)
                    FROM bugs b
                    INNER JOIN scientist_bugs sb ON b.id = sb.bug_id
                    WHERE sb.scientist_id = s.id), 
                    '[]'
                ) as bugs
            FROM scientist s
        `);
		res.json(result.rows);
	} catch (error) {
		console.error("Error fetching scientists:", error);
		res.status(500).json({ error: error.message });
	}
};

const assignBug = async (req, res) => {
	try {
		const { id } = req.params;
		const { bug_id } = req.body;

		// First check if assignment already exists
		const existing = await pool.query(
			"SELECT * FROM scientist_bugs WHERE scientist_id = $1 AND bug_id = $2",
			[id, bug_id]
		);

		if (existing.rows.length > 0) {
			return res.status(409).json({
				error: "This bug is already assigned to this scientist",
			});
		}

		const result = await pool.query(
			"INSERT INTO scientist_bugs (scientist_id, bug_id) VALUES ($1, $2) RETURNING *",
			[id, bug_id]
		);

		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("Error assigning bug:", error);
		res.status(500).json({ error: error.message });
	}
};

const getScientistBugs = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT b.* FROM bugs b JOIN scientist_bugs sb ON b.id = sb.bug_id WHERE sb.scientist_id = $1",
			[id]
		);
		res.json(result.rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
const deleteScientist = async (req, res) => {
	try {
		const { id } = req.params; // get the id from the params
		const result = await pool.query(
			"DELETE FROM scientist WHERE id = $1 RETURNING *",
			[id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: " Scientist not found" });
		}
		res.json({
			message: "Scientist deleted successfully",
			deleted: result.rows[0],
		});
	} catch (error) {
		console.error("Error deleting scientist:", error);
		res.status(500).json({ error: error.message });
	}
};

const updateScientist = async (req, res) => {
	try {
		const { id } = req.params; // get the id from the params
		// destructer the request body for what we need
		const { name, email, password } = req.body;

		const result = await pool.query(
			"UPDATE scientist SET name = $1, email = $2, password = COALESCE($3, password) WHERE id = $4 RETURNING *",
			[name, email, password || null, id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Scientist not found" });
		}
		res.json({
			message: "Scientist updated successfully",
			scientist: result.rows[0],
		});
	} catch (error) {
		console.error("Error updating scientist:", error);
		res.status(500).json({ error: error.message });
	}
};

const unassignBug = async (req, res) => {
	try {
		const { id } = req.params; // match the route `/scientist/:id/bug`
		const { bug_id } = req.body;

		if (!id || !bug_id) {
			return res.status(400).json({ error: "Missing required parameters" });
		}

		// Find scientist in db
		const existingAssignment = await pool.query(
			"SELECT * FROM scientist_bugs WHERE scientist_id = $1 AND bug_id = $2",
			[id, bug_id]
		);

		if (existingAssignment.rows.length === 0) {
			return res.status(404).json({
				error: "Bug is not assigned to this scientist",
			});
		}

		const result = await pool.query(
			"DELETE FROM scientist_bugs WHERE scientist_id = $1 AND bug_id = $2 RETURNING *",
			[id, bug_id]
		);

		res.status(200).json({
			message: "Bug unassigned successfully",
			unassigned: result.rows[0],
		});
	} catch (error) {
		console.error("Error unassigning bug:", error);
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	registerScientist,
	getAllScientists,
	assignBug,
	deleteScientist,
	getScientistBugs,
	updateScientist,
	unassignBug,
};
