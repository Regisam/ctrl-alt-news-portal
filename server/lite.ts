import express from "express";
import { createServer } from "http";

const app = express();
const server = createServer(app);

console.log("✅ Server starting...");

// Minimal middleware
app.use(express.json());

// Serve public files (simple path, no __dirname)
try {
  app.use(express.static("dist/public"));
  console.log("✅ Static files configured");
} catch (err) {
  console.error("❌ Error setting up static files:", err);
}

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback to index.html for client-side routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Catch any uncaught errors
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});
