const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const registerScientist = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required for registration",
      });
    }

    await client.query("BEGIN");

    const existingUserCheck = await client.query(
      "SELECT id FROM public.users WHERE email = $1",
      [email]
    );
    if (existingUserCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log("Password hashed successfully for registration.");

    const userResult = await client.query(
      "INSERT INTO public.users (email, hashed_password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );
    const newUser = userResult.rows[0];
    console.log("New user inserted:", newUser.email, "ID:", newUser.id);

    const scientistResult = await client.query(
      "INSERT INTO public.scientist (name, email, user_id) VALUES ($1, $2, $3) RETURNING id, name, email, created_at, user_id",
      [name, email, newUser.id]
    );
    const newScientist = scientistResult.rows[0];
    console.log(
      "Linked scientist profile created:",
      newScientist.name,
      "ID:",
      newScientist.id,
      "Linked User ID:",
      newScientist.user_id
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Scientist and User registered successfully",
      scientist: {
        id: newScientist.id,
        name: newScientist.name,
        email: newScientist.email,
        user_id: newScientist.user_id,
        created_at: newScientist.created_at,
      },
      user_id: newUser.id,
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }

    console.error("Error registering scientist:", error);

    if (error.code === "23505" && error.constraint === "users_email_key") {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }
    if (error.code === "23505" && error.constraint === "scientist_email_key") {
      return res
        .status(409)
        .json({ error: "Scientist with this email already exists" });
    }

    res.status(500).json({
      error: "Failed to register scientist",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    if (client) {
      client.release();
    }
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
                s.user_id,
                COALESCE(
                    (SELECT json_agg(b.*)
                    FROM bugs b
                    INNER JOIN scientist_bugs sb ON b.id = sb.bug_id
                    WHERE sb.scientist_id = s.id),
                    '[]'
                ) as bugs
            FROM public.scientist s
        `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching scientists:", error);
    res.status(500).json({
      error: "Failed to fetch scientists",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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

    if (!id || !bug_id) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    if (isNaN(parseInt(id)) || isNaN(parseInt(bug_id))) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    client = await pool.connect();

    await client.query("BEGIN");

    const scientistCheck = await client.query(
      "SELECT id FROM public.scientist WHERE id = $1",
      [id]
    );

    if (scientistCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Scientist not found" });
    }

    const bugCheck = await client.query(
      "SELECT id FROM public.bugs WHERE id = $1",
      [bug_id]
    );

    if (bugCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Bug not found" });
    }

    const existingAssignment = await client.query(
      "SELECT * FROM public.scientist_bugs WHERE scientist_id = $1 AND bug_id = $2",
      [id, bug_id]
    );

    if (existingAssignment.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "This bug is already assigned to this scientist",
      });
    }

    const result = await client.query(
      "INSERT INTO public.scientist_bugs (scientist_id, bug_id) VALUES ($1, $2) RETURNING *",
      [id, bug_id]
    );

    await client.query("COMMIT");

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }

    console.error("Error assigning bug:", error);
    res.status(500).json({
      error: "Failed to assign bug",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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

    const scientistCheck = await client.query(
      "SELECT id FROM public.scientist WHERE id = $1",
      [id]
    );

    if (scientistCheck.rows.length === 0) {
      return res.status(404).json({ error: "Scientist not found" });
    }

    const result = await client.query(
      "SELECT b.* FROM public.bugs b JOIN public.scientist_bugs sb ON b.id = sb.bug_id WHERE sb.scientist_id = $1",
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching scientist bugs:", error);
    res.status(500).json({
      error: "Failed to fetch scientist bugs",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
    await client.query("BEGIN");

    const scientistToDeleteCheck = await client.query(
      "SELECT user_id FROM public.scientist WHERE id = $1",
      [id]
    );

    if (scientistToDeleteCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Scientist not found" });
    }

    const userIdToDelete = scientistToDeleteCheck.rows[0].user_id;

    const result = await client.query(
      "DELETE FROM public.scientist WHERE id = $1 RETURNING id, name, email, created_at",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Scientist not found during deletion" });
    }

    if (userIdToDelete !== null) {
      await client.query("DELETE FROM public.users WHERE id = $1", [
        userIdToDelete,
      ]);
      console.log(
        "Deleted linked user with ID:",
        userIdToDelete,
        "for scientist ID:",
        id
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Scientist and linked user (if any) deleted successfully",
      deleted: result.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }

    console.error("Error deleting scientist:", error);
    res.status(500).json({
      error: "Failed to delete scientist",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
    await client.query("BEGIN");

    const scientistCheck = await client.query(
      "SELECT id, user_id, email FROM public.scientist WHERE id = $1",
      [id]
    );

    if (scientistCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Scientist not found" });
    }

    const scientistToUpdate = scientistCheck.rows[0];
    const userId = scientistToUpdate.user_id;

    if (email && email !== scientistToUpdate.email) {
      const emailCheck = await client.query(
        "SELECT id FROM public.scientist WHERE email = $1 AND id != $2",
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({ error: "Scientist with this email already exists" });
      }
    }

    if (password) {
      console.log("Password provided for update.");
      if (userId === null) {
        console.log(
          "Cannot update password: Scientist ID",
          id,
          "is not linked to a user."
        );
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Cannot update password for a scientist not linked to a user.",
        });
      }

      console.log("Updating password for linked user ID:", userId);
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const userUpdateResult = await client.query(
        "UPDATE public.users SET hashed_password = $1 WHERE id = $2",
        [hashedPassword, userId]
      );

      if (userUpdateResult.rowCount === 0) {
        console.error(
          "Linked user not found during password update for scientist ID:",
          id,
          "User ID:",
          userId
        );
        await client.query("ROLLBACK");
        return res
          .status(500)
          .json({ error: "Internal error: Linked user not found." });
      }
      console.log("Password updated for user ID:", userId);
    } else {
      console.log("No new password provided for scientist update.");
    }

    const scientistUpdateResult = await client.query(
      "UPDATE public.scientist SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at, user_id",
      [name, email, id]
    );
    const updatedScientist = scientistUpdateResult.rows[0];

    await client.query("COMMIT");

    res.json({
      message: "Scientist updated successfully",
      scientist: {
        id: updatedScientist.id,
        name: updatedScientist.name,
        email: updatedScientist.email,
        user_id: updatedScientist.user_id,
        created_at: updatedScientist.created_at,
      },
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }

    console.error("Error updating scientist:", error);

    if (error.code === "42703") {
      return res.status(500).json({
        error: "Database error: Column not found.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    if (error.constraint === "scientist_email_key") {
      return res
        .status(409)
        .json({ error: "Scientist with this email already exists" });
    }
    if (
      error.message ===
      "Cannot update password for a scientist not linked to a user."
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Failed to update scientist",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    if (client) {
      client.release();
    }
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

    await client.query("BEGIN");

    const scientistCheck = await client.query(
      "SELECT id FROM public.scientist WHERE id = $1",
      [id]
    );

    if (scientistCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Scientist not found" });
    }

    const bugCheck = await client.query(
      "SELECT id FROM public.bugs WHERE id = $1",
      [bug_id]
    );

    if (bugCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Bug not found" });
    }

    const existingAssignment = await client.query(
      "SELECT id FROM public.scientist_bugs WHERE scientist_id = $1 AND bug_id = $2",
      [id, bug_id]
    );

    if (existingAssignment.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "This bug is not assigned to this scientist",
      });
    }

    const result = await client.query(
      "DELETE FROM public.scientist_bugs WHERE scientist_id = $1 AND bug_id = $2 RETURNING *",
      [id, bug_id]
    );

    if (result.rowCount === 0) {
      console.error(
        "Delete failed after existence check for scientist:",
        id,
        "bug:",
        bug_id
      );
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "Failed to delete assignment." });
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Bug unassigned successfully",
      unassigned: result.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }

    console.error("Error unassigning bug:", error);
    res.status(500).json({
      error: "Failed to unassign bug",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
