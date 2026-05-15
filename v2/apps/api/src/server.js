import http from "http";
import mongoose from "mongoose";
import { app } from "./app.js";
import { connectDb } from "./db/connect.js";
import { env, validateEnv } from "./config/env.js";
import { attachSocket } from "./socket.js";

const bootstrap = async () => {
  validateEnv();
  await connectDb();

  const server = http.createServer(app);
  attachSocket(server);

  server.listen(env.port, () => {
    console.log(`v2 API running on http://localhost:${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start v2 API", error);
  process.exit(1);
});
