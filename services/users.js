const prisma = require("../config/prismaClient");

async function findUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        scientist: {
          select: { name: true },
        },
      },
    });

    if (user) {
      return {
        id: user.id,
        email: user.email,
        hashed_password: user.hashed_password,

        name: user.scientist ? user.scientist.name : user.email,
      };
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
}

async function findUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    return user;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  findUserById,
  findUserByEmail,
};
