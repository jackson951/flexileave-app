require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

let prismaInstance;
let connectionPromise;
let hasConnected = false;

const getPrismaClient = () => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
    prismaInstance.$on("error", (error) => {
      console.error("Prisma client error:", error);
    });
  }
  return prismaInstance;
};

const connectPrisma = () => {
  if (hasConnected) {
    return Promise.resolve(getPrismaClient());
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const client = getPrismaClient();
  connectionPromise = client
    .$connect()
    .then(() => {
      hasConnected = true;
      return client;
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

module.exports = { getPrismaClient, connectPrisma };
