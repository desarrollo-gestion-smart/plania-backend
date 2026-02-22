// index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { initFirebase } from "./config/firebase.js";
// @ts-ignore
import { swaggerSpec } from "./config/swagger.js";
// @ts-ignore
import cookieParser from "cookie-parser";
// @ts-ignore
import uploadRoutes from "./routes/uploadRoutes.js";
// @ts-ignore
import userRoutes from "./routes/userRoutes.js";
// @ts-ignore
import staffRoutes from "./routes/staffRoutes.js";
// @ts-ignore
import appointmentsRoutes from "./routes/appointmentsRoutes.js";
// @ts-ignore
import servicesRoutes from "./routes/servicesRoutes.js";
// @ts-ignore
import schedulesRoutes from "./routes/schedulesRoutes.js";
// @ts-ignore
import expensesRoutes from "./routes/expensesRoutes.js";
// @ts-ignore
import incomesRoutes from "./routes/incomesRoutes.js";

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
app.use(cookieParser());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "25mb" }));
app.use(express.urlencoded({ limit: process.env.URLENCODED_BODY_LIMIT || "25mb", extended: true }));

// Log cuando llega una petición a /api/login (para comprobar si el backend recibe la petición)
app.use((req, res, next) => {
  if (req.method === "POST" && (req.path === "/api/login" || req.originalUrl === "/api/login")) {
    console.log("[LOGIN] 📥 Petición recibida en el servidor:", req.method, req.originalUrl, new Date().toISOString());
  }
  next();
});

// Swagger UI — documentación de la API en /api/docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Plania API Docs",
  customCss: ".swagger-ui .topbar { display: none }",
}));
// Endpoint para obtener el JSON de la especificación OpenAPI
app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Prueba de conectividad desde el móvil: abre en el navegador del teléfono http://TU_IP:3000/api/health
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, message: "Backend reachable" });
});

app.use("/api", uploadRoutes);
app.use("/api", userRoutes);
app.use("/api", staffRoutes);
app.use("/api", appointmentsRoutes);
app.use("/api", servicesRoutes);
app.use("/api", schedulesRoutes);
app.use("/api", expensesRoutes);
app.use("/api", incomesRoutes);

const envPort = process.env.PORT;
const PORT = envPort && !isNaN(Number(envPort)) ? Number(envPort) : 3000;
// Escuchar en 0.0.0.0 para que el servidor sea accesible desde la red local (ej. app móvil en 192.168.x.x)
const HOST = process.env.HOST || "0.0.0.0";
const server = app.listen(PORT, HOST, () => {
  const addr = server.address();
  const actualPort = typeof addr === 'string' ? addr : addr?.port;
  console.log(`Servidor corriendo en http://${HOST}:${actualPort}`);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
