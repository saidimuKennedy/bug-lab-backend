const { pool } = require("../config/db");

const createBug = async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const { name, strength, type } = req.body;

    if (!name || !strength || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      "INSERT INTO public.bugs (name, strength, type) VALUES ($1, $2, $3) RETURNING *",
      [name, strength, type]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Bug created successfully",
      bug: result.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }

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
    const result = await client.query("SELECT * FROM public.bugs");
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

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid bug ID" });
    }

    client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM public.bugs WHERE id = $1",
      [id]
    );

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

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid bug ID" });
    }

    if (!name || !strength || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    client = await pool.connect();

    await client.query("BEGIN");

    const bugCheck = await client.query(
      "SELECT id FROM public.bugs WHERE id = $1",
      [id]
    );

    if (bugCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Bug not found" });
    }

    const result = await client.query(
      "UPDATE public.bugs SET name = $1, strength = $2, type = $3 WHERE id = $4 RETURNING *",
      [name, strength, type, id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Bug updated successfully",
      bug: result.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }

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

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid bug ID" });
    }

    client = await pool.connect();

    await client.query("BEGIN");

    const bugCheck = await client.query(
      "SELECT id FROM public.bugs WHERE id = $1",
      [id]
    );

    if (bugCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Bug not found" });
    }

    await client.query("DELETE FROM public.scientist_bugs WHERE bug_id = $1", [
      id,
    ]);

    const result = await client.query(
      "DELETE FROM public.bugs WHERE id = $1 RETURNING *",
      [id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Bug deleted successfully",
      bug: result.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }

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
