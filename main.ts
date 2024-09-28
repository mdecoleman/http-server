import { Server } from "./server.ts";

function start() {
  const server = new Server()
    .port(3000)
    .get("/", async (_req, res) => {
      res.setBody("Application root").setStatusCode(200);
    })
    .get("/transactions", async (_req, res) => {
      res.setBody("Transactions root").setStatusCode(200);
    });

  server.listen();
}

start();
