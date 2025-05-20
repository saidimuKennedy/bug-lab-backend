// src/controllers/bugsController.js

// REMOVE THIS LINE: const { pool } = require("../config/db");
const prisma = require("../config/prismaClient"); // Keep this line

const createBug = async (req, res) => {
  // No need for `let client;` or `client = await pool.connect();`
  try {
    const { name, strength, type } = req.body;

    if (!name || !strength || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Old: await client.query("BEGIN");
    // Old: const result = await client.query("INSERT INTO public.bugs (...) RETURNING *", [...]);
    // Old: await client.query("COMMIT");

    // NEW WITH PRISMA: `create` handles insertion and returns the created object automatically.
    // Transactions are implicitly handled for single operations or explicitly with prisma.$transaction for multiple.
    const newBug = await prisma.bug.create({
      data: { // This object maps directly to your bug's fields
        name,
        strength,
        type,
      },
    });

    res.status(201).json({
      message: "Bug created successfully",
      bug: newBug, // Prisma returns the created object directly
    });
  } catch (error) {
    // Old: if (client) { try { await client.query("ROLLBACK"); } ... }
    // Prisma handles connection pooling and transaction rollbacks for single operations automatically.
    // For explicit transactions (like updateBug where multiple DB calls are linked), you use prisma.$transaction.
    console.error("Error creating bug:", error);
    res.status(500).json({
      error: "Failed to create bug",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
  // No `finally` block for `client.release();` needed. Prisma manages connections.
};

const getAllBugs = async (req, res) => {
  // Old: let client; client = await pool.connect();
  try {
    // Old: const result = await client.query("SELECT * FROM public.bugs");
    // NEW WITH PRISMA: `findMany` is the equivalent of `SELECT *`
    const bugs = await prisma.bug.findMany({
      orderBy: { // Good practice to order results
        id: 'asc',
      },
    });

    res.status(200).json(bugs); // Prisma returns the array of objects directly
  } catch (error) {
    console.error("Error fetching bugs:", error);
    res.status(500).json({
      error: "Failed to fetch bugs",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
  // No `finally` block needed
};

const getBugById = async (req, res) => {
  // Old: let client;
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid bug ID" });
    }

    // Old: client = await pool.connect();
    // Old: const result = await client.query("SELECT * FROM public.bugs WHERE id = $1", [id]);

    // NEW WITH PRISMA: `findUnique` is for fetching by unique fields like ID.
    // Prisma expects integer for Int fields, so `parseInt(id)` is correct here.
    const bug = await prisma.bug.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    // Prisma returns `null` if no record is found, unlike `result.rows.length === 0`.
    if (!bug) {
      return res.status(404).json({ message: "Bug not found" });
    }

    res.status(200).json(bug); // Prisma returns the object directly
  } catch (error) {
    console.error("Error fetching bug:", error);
    res.status(500).json({
      error: "Failed to fetch bug",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
  // No `finally` block needed
};

const updateBug = async (req, res) => {
  // Old: let client;
  try {
    const { id } = req.params;
    const { name, strength, type } = req.body;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid bug ID" });
    }

    if (!name || !strength || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Old: client = await pool.connect(); await client.query("BEGIN");
    // Old: const bugCheck = await client.query("SELECT id FROM public.bugs WHERE id = $1", [id]);
    // Old: if (bugCheck.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json(...); }

    // NEW WITH PRISMA: `update` attempts to update and returns the updated object.
    // If the record is not found, it throws a PrismaClientKnownRequestError with code 'P2025'.
    const updatedBug = await prisma.bug.update({
      where: {
        id: parseInt(id), // Specify which bug to update
      },
      data: { // Specify the new values
        name,
        strength,
        type,
      },
    });

    // Old: await client.query("COMMIT");

    res.status(200).json({
      message: "Bug updated successfully",
      bug: updatedBug, // Prisma returns the updated object directly
    });
  } catch (error) {
    // Old: if (client) { try { await client.query("ROLLBACK"); } ... }
    // Check for Prisma's specific error code for "record not found"
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Bug not found" });
    }
    console.error("Error updating bug:", error);
    res.status(500).json({
      error: "Failed to update bug",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
  // No `finally` block needed
};

const deleteBug = async (req, res) => {
  // Old: let client;
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid bug ID" });
    }

    // Old: client = await pool.connect(); await client.query("BEGIN");
    // Old: const bugCheck = await client.query("SELECT id FROM public.bugs WHERE id = $1", [id]);
    // Old: if (bugCheck.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json(...); }

    // Old: await client.query("DELETE FROM public.scientist_bugs WHERE bug_id = $1", [id]);
    // NEW WITH PRISMA: Due to `onDelete: Cascade` in your schema.prisma,
    // deleting a `Bug` record will automatically delete associated `scientist_bugs` entries.
    // No separate `deleteMany` for `scientist_bugs` needed here.

    // NEW WITH PRISMA: `delete` attempts to delete and returns the deleted object.
    // If the record is not found, it throws a PrismaClientKnownRequestError with code 'P2025'.
    const deletedBug = await prisma.bug.delete({
      where: {
        id: parseInt(id),
      },
    });

    // Old: await client.query("COMMIT");

    res.status(200).json({
      message: "Bug deleted successfully",
      bug: deletedBug, // Prisma returns the deleted object
    });
  } catch (error) {
    // Check for Prisma's specific error code for "record not found"
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Bug not found" });
    }
    console.error("Error deleting bug:", error);
    res.status(500).json({
      error: "Failed to delete bug",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
  // No `finally` block needed
};

module.exports = {
  createBug,
  getAllBugs,
  getBugById,
  updateBug,
  deleteBug,
  // If you had `assignBugToScientists` in your original file,
  // we would rewrite that with Prisma's `createMany` and `connect`
  // as discussed in the first full refactor.
};