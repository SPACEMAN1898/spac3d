import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import type { Server as IOServer } from "socket.io";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { organizationsRouter } from "./routes/organizations.js";
import { createChannelsRouter } from "./routes/channels.js";

export function createApp(io: IOServer): express.Application {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/organizations", organizationsRouter);
  app.use("/api/organizations/:orgId/channels", createChannelsRouter(io));

  app.use(errorHandler);
  return app;
}
