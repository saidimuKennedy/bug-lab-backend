const prisma = require("../config/prismaClient");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const registerScientist = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required for registration",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newScientist = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: email },
      });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const newUser = await tx.user.create({
        data: {
          email,
          hashed_password: hashedPassword,
        },
        select: { id: true, email: true },
      });

      const scientist = await tx.scientist.create({
        data: {
          name,
          email,
          user: {
            connect: { id: newUser.id },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          created_at: true,
          user_id: true,
        },
      });
      return { newUser, scientist };
    });

    res.status(201).json({
      message: "Scientist and User registered successfully",
      scientist: {
        id: newScientist.scientist.id,
        name: newScientist.scientist.name,
        email: newScientist.scientist.email,
        user_id: newScientist.scientist.user_id,
        created_at: newScientist.scientist.created_at,
      },
      user_id: newScientist.newUser.id,
    });
  } catch (error) {
    console.error("Error registering scientist:", error);

    if (error.message === "User with this email already exists") {
      return res.status(409).json({ error: error.message });
    }
    if (error.code === "P2002") {
      // Prisma's unique constraint violation error code
      if (error.meta.target.includes("email")) {
        return res
          .status(409)
          .json({ error: "Scientist with this email already exists" });
      }
    }

    res.status(500).json({
      error: "Failed to register scientist",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAllScientists = async (req, res) => {
  try {
    const scientists = await prisma.scientist.findMany({
      include: {
        scientistBugs: {
          include: {
            bug: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const formattedScientists = scientists.map((scientist) => ({
      id: scientist.id,
      name: scientist.name,
      email: scientist.email,
      created_at: scientist.created_at,
      user_id: scientist.user_id,
      bugs: scientist.scientistBugs.map((sb) => ({
        id: sb.bug.id,
        name: sb.bug.name,
        strength: sb.bug.strength,
        type: sb.bug.type,
        created_at: sb.bug.created_at,
      })),
    }));

    res.json(formattedScientists);
  } catch (error) {
    console.error("Error fetching scientists:", error);
    res.status(500).json({
      error: "Failed to fetch scientists",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const assignBug = async (req, res) => {
  try {
    const { id } = req.params;
    const { bug_id } = req.body;

    if (!id || !bug_id) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const scientistId = parseInt(id);
    const parsedBugId = parseInt(bug_id);

    if (isNaN(scientistId) || isNaN(parsedBugId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const newAssignment = await prisma.$transaction(async (tx) => {
      const scientist = await tx.scientist.findUnique({
        where: { id: scientistId },
      });
      if (!scientist) {
        throw new Error("Scientist not found");
      }

      const bug = await tx.bug.findUnique({ where: { id: parsedBugId } });
      if (!bug) {
        throw new Error("Bug not found");
      }

      const existingAssignment = await tx.scientistBug.findUnique({
        where: {
          scientist_id_bug_id: {
            // Compound primary key for unique check
            scientist_id: scientistId,
            bug_id: parsedBugId,
          },
        },
      });

      if (existingAssignment) {
        throw new Error("This bug is already assigned to this scientist");
      }

      const result = await tx.scientistBug.create({
        data: {
          scientist_id: scientistId,
          bug_id: parsedBugId,
        },
      });
      return result;
    });

    res.status(201).json(newAssignment);
  } catch (error) {
    console.error("Error assigning bug:", error);
    if (
      error.message === "Scientist not found" ||
      error.message === "Bug not found"
    ) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "This bug is already assigned to this scientist") {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({
      error: "Failed to assign bug",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getScientistBugs = async (req, res) => {
  try {
    const { id } = req.params;
    const scientistId = parseInt(id);

    if (isNaN(scientistId)) {
      return res.status(400).json({ error: "Invalid scientist ID" });
    }

    const scientistWithBugs = await prisma.scientist.findUnique({
      where: { id: scientistId },
      include: {
        scientistBugs: {
          include: {
            bug: true,
          },
        },
      },
    });

    if (!scientistWithBugs) {
      return res.status(404).json({ error: "Scientist not found" });
    }

    const bugs = scientistWithBugs.scientistBugs.map((sb) => ({
      id: sb.bug.id,
      name: sb.bug.name,
      strength: sb.bug.strength,
      type: sb.bug.type,
      created_at: sb.bug.created_at,
    }));

    res.json(bugs);
  } catch (error) {
    console.error("Error fetching scientist bugs:", error);
    res.status(500).json({
      error: "Failed to fetch scientist bugs",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteScientist = async (req, res) => {
  try {
    const { id } = req.params;
    const scientistId = parseInt(id);

    if (isNaN(scientistId)) {
      return res.status(400).json({ error: "Invalid scientist ID" });
    }

    const deletedScientist = await prisma.$transaction(async (tx) => {
      const scientistToDelete = await tx.scientist.findUnique({
        where: { id: scientistId },
        select: { user_id: true },
      });

      if (!scientistToDelete) {
        throw new Error("Scientist not found");
      }

      const deletedScientistResult = await tx.scientist.delete({
        where: { id: scientistId },
        select: { id: true, name: true, email: true, created_at: true },
      });

      if (scientistToDelete.user_id !== null) {
        await tx.user.delete({
          where: { id: scientistToDelete.user_id },
        });
      }
      return deletedScientistResult;
    });

    res.json({
      message: "Scientist and linked user (if any) deleted successfully",
      deleted: deletedScientist,
    });
  } catch (error) {
    console.error("Error deleting scientist:", error);
    if (error.message === "Scientist not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.code === "P2025") {
      // Catches not found if the delete operation itself fails
      return res
        .status(404)
        .json({ error: "Scientist not found during deletion" });
    }
    res.status(500).json({
      error: "Failed to delete scientist",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateScientist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const scientistId = parseInt(id);

    if (isNaN(scientistId)) {
      return res.status(400).json({ error: "Invalid scientist ID" });
    }

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const updatedScientist = await prisma.$transaction(async (tx) => {
      const scientistToUpdate = await tx.scientist.findUnique({
        where: { id: scientistId },
        select: { id: true, user_id: true, email: true },
      });

      if (!scientistToUpdate) {
        throw new Error("Scientist not found");
      }

      if (email && email !== scientistToUpdate.email) {
        const emailCheck = await tx.scientist.findUnique({
          where: { email: email },
        });
        if (emailCheck && emailCheck.id !== scientistId) {
          throw new Error("Scientist with this email already exists");
        }
      }

      if (password) {
        if (scientistToUpdate.user_id === null) {
          throw new Error(
            "Cannot update password for a scientist not linked to a user."
          );
        }
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await tx.user.update({
          where: { id: scientistToUpdate.user_id },
          data: { hashed_password: hashedPassword },
        });
      }

      const result = await tx.scientist.update({
        where: { id: scientistId },
        data: { name, email },
        select: {
          id: true,
          name: true,
          email: true,
          created_at: true,
          user_id: true,
        },
      });
      return result;
    });

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
    console.error("Error updating scientist:", error);
    if (error.message === "Scientist not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Scientist with this email already exists") {
      return res.status(409).json({ error: error.message });
    }
    if (
      error.message ===
      "Cannot update password for a scientist not linked to a user."
    ) {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === "P2025") {
      // Catches not found if the update operation itself fails
      return res.status(404).json({ error: "Scientist not found" });
    }
    res.status(500).json({
      error: "Failed to update scientist",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const unassignBug = async (req, res) => {
  try {
    const { id } = req.params;
    const { bug_id } = req.body;

    if (!id || !bug_id) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const scientistId = parseInt(id);
    const parsedBugId = parseInt(bug_id);

    if (isNaN(scientistId) || isNaN(parsedBugId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const deletedAssignment = await prisma.$transaction(async (tx) => {
      const scientist = await tx.scientist.findUnique({
        where: { id: scientistId },
      });
      if (!scientist) {
        throw new Error("Scientist not found");
      }

      const bug = await tx.bug.findUnique({ where: { id: parsedBugId } });
      if (!bug) {
        throw new Error("Bug not found");
      }

      const existingAssignment = await tx.scientistBug.findUnique({
        where: {
          scientist_id_bug_id: {
            // Compound primary key
            scientist_id: scientistId,
            bug_id: parsedBugId,
          },
        },
      });

      if (!existingAssignment) {
        throw new Error("This bug is not assigned to this scientist");
      }

      const result = await tx.scientistBug.delete({
        where: {
          scientist_id_bug_id: {
            scientist_id: scientistId,
            bug_id: parsedBugId,
          },
        },
      });
      return result;
    });

    res.status(200).json({
      message: "Bug unassigned successfully",
      unassigned: deletedAssignment,
    });
  } catch (error) {
    console.error("Error unassigning bug:", error);
    if (
      error.message === "Scientist not found" ||
      error.message === "Bug not found"
    ) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "This bug is not assigned to this scientist") {
      return res.status(409).json({ error: error.message });
    }
    if (error.code === "P2025") {
      // Catches not found if the delete operation itself fails (e.g., race condition)
      return res
        .status(404)
        .json({ error: "Assignment not found during deletion" });
    }
    res.status(500).json({
      error: "Failed to unassign bug",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
