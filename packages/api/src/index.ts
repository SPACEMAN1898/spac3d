import { createServer } from "node:http";
import { env } from "./lib/env.js";
import { createApp } from "./app.js";
import { attachSocketIO } from "./socket.js";

const httpServer = createServer();
const io = attachSocketIO(httpServer);
const app = createApp(io);

httpServer.on("request", app);

httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
