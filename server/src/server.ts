import { Server } from "http";
import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
import { closeRedis } from "./lib/redis";

async function main() {
  const port = config.port;
  const server: Server = app.listen(port, () => {
    console.info(`Server is running on port ${port}`);
  });

  const exitHandler = async () => {
    if (server) {
      server.close(async () => {
        console.info("Server closed!");
      });
    }
    await prisma.$disconnect();
    await closeRedis();
    process.exit(1);
  };

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    void exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
    void exitHandler();
  });

  // Graceful shutdown on SIGTERM (used by Render / Docker)
  process.on("SIGTERM", () => {
    console.info("SIGTERM received. Shutting down gracefully...");
    void exitHandler();
  });
}

void main();
