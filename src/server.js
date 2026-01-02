import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { connect, disconnect } from "./db.js";

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/posts-app";

async function start() {
  try {
    await connect(MONGODB_URI);
    const app = createApp();
    const server = app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });

    process.on("SIGINT", async () => {
      console.log("Shutting down...");
      await disconnect();
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error("Failed to start application:", err);
    process.exit(1);
  }
}

start();
