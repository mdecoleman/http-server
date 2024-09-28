import { Server } from "./server.ts";

function start() {
  const server = new Server().port(3000);

  server.listen();
}

start();
