// index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { initFirebase } from "./config/firebase.js";
// @ts-ignore
import uploadRoutes from "./routes/uploadRoutes.js";
// @ts-ignore
import userRoutes from "./routes/userRoutes.js";
// @ts-ignore
import staffRoutes from "./routes/staffRoutes.js";
// @ts-ignore
import appointmentsRoutes from "./routes/appointmentsRoutes.js";

dotenv.config();

initFirebase();

const app = express();
// Configure CORS to allow credentials and specific origins (no wildcard when credentials are used)
const allowedOrigins = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [
      "http://localhost:19006", // Expo web local default
      "http://192.168.0.161:8081", // Expo Go/web on local network
    ]);

const localOriginPatterns = [
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
  /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/,
  /^https?:\/\/10\.\d+\.\d+\.\d+(?::\d+)?$/,
];

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // Some native/mobile requests may not include an Origin header
    if (!origin) return callback(null, true);
    // Explicit allow-list via env or defaults
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow common local dev origins by pattern (useful when IP or port varies)
    if (localOriginPatterns.some((rx) => rx.test(origin))) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Handle preflight for API routes (wildcard requires a named param with path-to-regexp v7)
app.options("/api/*splat", cors(corsOptions));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "25mb" }));
app.use(express.urlencoded({ limit: process.env.URLENCODED_BODY_LIMIT || "25mb", extended: true }));

app.use("/api", uploadRoutes);
app.use("/api", userRoutes);
app.use("/api", staffRoutes);
app.use("/api", appointmentsRoutes);

const envPort = process.env.PORT;
const PORT = envPort && !isNaN(Number(envPort)) ? Number(envPort) : 3000;
const server = app.listen(PORT, () => {
  const addr = server.address();
  const actualPort = typeof addr === 'string' ? addr : addr?.port;
  console.log(`Servidor corriendo en puerto ${actualPort}`);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});