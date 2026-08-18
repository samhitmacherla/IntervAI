// Single shared Prisma client instance. Importing this file anywhere
// in the app reuses the same connection pool instead of opening a
// new one per request.

require("./env"); // ensures DATABASE_URL is validated before Prisma reads it
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

module.exports = prisma;
