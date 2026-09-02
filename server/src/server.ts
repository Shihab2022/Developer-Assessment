import { Server } from "http";
import app from "./app";
import config from "./config";

async function main() {
  const port = config.port;
  const server: Server = app.listen(port, () => {
    console.log(`Server is running on  ${port}`);
  });
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info("Server closed!");
      });
    }
    process.exit(1);
  };
  process.on("uncaughtException", (error) => {
    console.log(error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.log(error);
    exitHandler();
  });
}

main();
