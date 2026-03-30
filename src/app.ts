import express from "express";
import cors from "cors";
import filesRoutes from "./routes/files.js";

export function createApp() {
  const app = express();

  app.use(cors());

  // No JSON body parser for file routes — they handle raw bodies
  app.use("/files", filesRoutes);

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "openmedia-nzb",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return app;
}

export default createApp;
