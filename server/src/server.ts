import { Server } from "http";
import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
import { closeRedis } from "./lib/redis";

async function main() {
  const port = config.port;
  const server: Server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${port}`);
  });

  const exitHandler = async () => {
    if (server) {
      server.close(async () => {
        // eslint-disable-next-line no-console
        console.info("Server closed!");
      });
    }
    await prisma.$disconnect();
    await closeRedis();
    process.exit(1);
  };

  process.on("uncaughtException", (error) => {
    // eslint-disable-next-line no-console
    console.error("Uncaught Exception:", error);
    void exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled Rejection:", error);
    void exitHandler();
  });

  // Graceful shutdown on SIGTERM (used by Render / Docker)
  process.on("SIGTERM", () => {
    // eslint-disable-next-line no-console
    console.info("SIGTERM received. Shutting down gracefully...");
    void exitHandler();
  });
}

void main();