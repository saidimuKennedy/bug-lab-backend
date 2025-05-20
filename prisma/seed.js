// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt"); // Make sure you have bcrypt installed for hashing passwords

const prisma = new PrismaClient();
const SALT_ROUNDS = 10; // Same as in your controllers

async function main() {
  console.log("Start seeding...");

  // 1. Clear existing data (optional, but good for repeatable seeding)
  //    This ensures that running the seed script multiple times won't
  //    create duplicate data. Adjust the order based on foreign key constraints
  //    (delete children before parents).
  await prisma.scientistBug.deleteMany();
  await prisma.scientist.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared existing data.");

  // 2. Create Users
  const hashedPassword1 = await bcrypt.hash("password123", SALT_ROUNDS);
  const hashedPassword2 = await bcrypt.hash("secret456", SALT_ROUNDS);
  const hashedPassword3 = await bcrypt.hash("mypassword", SALT_ROUNDS);

  const user1 = await prisma.user.create({
    data: {
      email: "alice@example.com",
      hashed_password: hashedPassword1,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      email: "bob@example.com",
      hashed_password: hashedPassword2,
    },
  });
  const user3 = await prisma.user.create({
    data: {
      email: "charlie@example.com",
      hashed_password: hashedPassword3,
    },
  });
  console.log("Created users.");

  // 3. Create Scientists (linked to Users where applicable)
  const scientist1 = await prisma.scientist.create({
    data: {
      name: "Alice Smith",
      email: user1.email, // Use the user's email
      user: {
        connect: { id: user1.id }, // Link to user1
      },
    },
  });

  const scientist2 = await prisma.scientist.create({
    data: {
      name: "Bob Johnson",
      email: user2.email, // Use the user's email
      user: {
        connect: { id: user2.id }, // Link to user2
      },
    },
  });

  const scientist3 = await prisma.scientist.create({
    data: {
      name: "Dr. Jane Doe",
      email: "jane.doe@example.com", // A scientist without a linked user
      user_id: null,
    },
  });
  console.log("Created scientists.");

  // 4. Create Bugs
  const bug1 = await prisma.bug.create({
    data: {
      name: "API Latency Issues",
      strength: 80,
      type: "Critical",
    },
  });
  const bug2 = await prisma.bug.create({
    data: {
      name: "UI Glitch on Login",
      strength: 30,
      type: "Minor",
    },
  });
  const bug3 = await prisma.bug.create({
    data: {
      name: "Database Connection Leak",
      strength: 95,
      type: "Critical",
    },
  });
  const bug4 = await prisma.bug.create({
    data: {
      name: "Broken Image Link on Dashboard",
      strength: 10,
      type: "Trivial",
    },
  });
  console.log("Created bugs.");

  // 5. Assign Bugs to Scientists (using the join table)
  await prisma.scientistBug.create({
    data: {
      scientist_id: scientist1.id,
      bug_id: bug1.id,
    },
  });

  await prisma.scientistBug.create({
    data: {
      scientist_id: scientist1.id,
      bug_id: bug2.id,
    },
  });

  await prisma.scientistBug.create({
    data: {
      scientist_id: scientist2.id,
      bug_id: bug1.id, // Bug 1 assigned to two scientists
    },
  });

  await prisma.scientistBug.create({
    data: {
      scientist_id: scientist3.id,
      bug_id: bug3.id,
    },
  });
  console.log("Assigned bugs to scientists.");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
