// Import the pool from your updated db config
const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const registerScientist = async (req, res) => {
    let client;
    try {
        // Get client from pool
        client = await pool.connect();
        
        // Destructure the request body
        const { name, email, password } = req.body;
        
        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Start transaction
        await client.query('BEGIN');

        const result = await client.query(
            "INSERT INTO scientist (name, email, password) VALUES($1, $2, $3) RETURNING id, name, email, created_at",
            [name, email, hashedPassword]
        );

        // Commit transaction
        await client.query('COMMIT');

        // Return the result to the client (note: we exclude the password from the response)
        res.status(201).json({
            message: "Scientist added successfully",
            scientist: result.rows[0],
        });
    } catch (error) {
        // Rollback on error
        if (client) await client.query('ROLLBACK');
        
        console.error("Error registering scientist:", error);
        
        // Handle duplicate email error (PostgreSQL error code 23505 is for unique_violation)
        if (error.code === '23505' && error.constraint === 'scientist_email_key') {
            return res.status(409).json({ error: "Email already registered" });
        }
        
        res.status(500).json({ 
            error: "Failed to register scientist",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        if (client) client.release();
    }
};

const getAllScientists = async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        
        const result = await client.query(`
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
        res.status(500).json({ 
            error: "Failed to fetch scientists",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        if (client) client.release();
    }
};

const assignBug = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { bug_id } = req.body;
        
        // Validate parameters
        if (!id || !bug_id) {
            return res.status(400).json({ error: "Missing required parameters" });
        }
        
        if (isNaN(parseInt(id)) || isNaN(parseInt(bug_id))) {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        
        client = await pool.connect();
        
        // Start transaction
        await client.query('BEGIN');
        
        // Check if scientist exists
        const scientistCheck = await client.query(
            "SELECT id FROM scientist WHERE id = $1",
            [id]
        );
        
        if (scientistCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Scientist not found" });
        }
        
        // Check if bug exists
        const bugCheck = await client.query(
            "SELECT id FROM bugs WHERE id = $1",
            [bug_id]
        );
        
        if (bugCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Bug not found" });
        }
        
        // Check if assignment already exists
        const existing = await client.query(
            "SELECT * FROM scientist_bugs WHERE scientist_id = $1 AND bug_id = $2",
            [id, bug_id]
        );

        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: "This bug is already assigned to this scientist",
            });
        }

        const result = await client.query(
            "INSERT INTO scientist_bugs (scientist_id, bug_id) VALUES ($1, $2) RETURNING *",
            [id, bug_id]
        );

        // Commit transaction
        await client.query('COMMIT');

        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Rollback on error
        if (client) await client.query('ROLLBACK');
        
        console.error("Error assigning bug:", error);
        res.status(500).json({ 
            error: "Failed to assign bug",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        if (client) client.release();
    }
};

const getScientistBugs = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: "Invalid scientist ID" });
        }
        
        client = await pool.connect();
        
        // First check if scientist exists
        const scientistCheck = await client.query(
            "SELECT id FROM scientist WHERE id = $1",
            [id]
        );
        
        if (scientistCheck.rows.length === 0) {
            return res.status(404).json({ error: "Scientist not found" });
        }
        
        const result = await client.query(
            "SELECT b.* FROM bugs b JOIN scientist_bugs sb ON b.id = sb.bug_id WHERE sb.scientist_id = $1",
            [id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching scientist bugs:", error);
        res.status(500).json({ 
            error: "Failed to fetch scientist bugs",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        if (client) client.release();
    }
};

const deleteScientist = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: "Invalid scientist ID" });
        }
        
        client = await pool.connect();
        
        // Start transaction
        await client.query('BEGIN');
        
        // First delete related entries in scientist_bugs
        await client.query("DELETE FROM scientist_bugs WHERE scientist_id = $1", [id]);
        
        // Then delete the scientist
        const result = await client.query(
            "DELETE FROM scientist WHERE id = $1 RETURNING id, name, email, created_at",
            [id]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Scientist not found" });
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        res.json({
            message: "Scientist deleted successfully",
            deleted: result.rows[0],
        });
    } catch (error) {
        // Rollback on error
        if (client) await client.query('ROLLBACK');
        
        console.error("Error deleting scientist:", error);
        res.status(500).json({ 
            error: "Failed to delete scientist",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        if (client) client.release();
    }
};

const updateScientist = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: "Invalid scientist ID" });
        }
        
        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }
        
        client = await pool.connect();
        
        // Start transaction
        await client.query('BEGIN');
        
        // Check if scientist exists
        const scientistCheck = await client.query(
            "SELECT id FROM scientist WHERE id = $1",
            [id]
        );
        
        if (scientistCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Scientist not found" });
        }

        // If updating email, check if the new email already exists (unless it's the same scientist)
        if (email) {
            const emailCheck = await client.query(
                "SELECT id FROM scientist WHERE email = $1 AND id != $2",
                [email, id]
            );
            
            if (emailCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: "Email already in use" });
            }
        }
        
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const result = await client.query(
            "UPDATE scientist SET name = $1, email = $2, password = COALESCE($3, password) WHERE id = $4 RETURNING id, name, email, created_at",
            [name, email, hashedPassword, id]
        );

        // Commit transaction
        await client.query('COMMIT');
        
        res.json({
            message: "Scientist updated successfully",
            scientist: result.rows[0],
        });
    } catch (error) {
        // Rollback on error
        if (client) await client.query('ROLLBACK');
        
        console.error("Error updating scientist:", error);
        res.status(500).json({ 
            error: "Failed to update scientist",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        if (client) client.release();
    }
};

const unassignBug = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { bug_id } = req.body;

        if (!id || !bug_id) {
            return res.status(400).json({ error: "Missing required parameters" });
        }
        
        if (isNaN(parseInt(id)) || isNaN(parseInt(bug_id))) {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        
        client = await pool.connect();
        
        // Start transaction
        await client.query('BEGIN');

        // Check if scientist exists
        const scientistCheck = await client.query(
            "SELECT id FROM scientist WHERE id = $1",
            [id]
        );
        
        if (scientistCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Scientist not found" });
        }

        // Find assignment in db
        const existingAssignment = await client.query(
            "SELECT * FROM scientist_bugs WHERE scientist_id = $1 AND bug_id = $2",
            [id, bug_id]
        );

        if (existingAssignment.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: "Bug is not assigned to this scientist",
            });
        }

        const result = await client.query(
            "DELETE FROM scientist_bugs WHERE scientist_id = $1 AND bug_id = $2 RETURNING *",
            [id, bug_id]
        );

        // Commit transaction
        await client.query('COMMIT');

        res.status(200).json({
            message: "Bug unassigned successfully",
            unassigned: result.rows[0],
        });
    } catch (error) {
        // Rollback on error
        if (client) await client.query('ROLLBACK');
        
        console.error("Error unassigning bug:", error);
        res.status(500).json({ 
            error: "Failed to unassign bug",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        if (client) client.release();
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