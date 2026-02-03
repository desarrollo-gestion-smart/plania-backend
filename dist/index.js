// index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// @ts-ignore
import uploadRoutes from "./routes/uploadRoutes.js";
// @ts-ignore
import userRoutes from "./routes/userRoutes.js";
// @ts-ignore
import staffRoutes from "./routes/staffRoutes.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", uploadRoutes);
app.use("/api", userRoutes);
app.use("/api", staffRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
//# sourceMappingURL=index.js.map