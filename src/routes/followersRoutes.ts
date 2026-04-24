import express from "express";
import {
  followBusinessController,
  getFollowersByBusinessController,
  getUserFollowingsController,
  unfollowBusinessController
} from "../controllers/followersController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /api/followers - Usuario sigue a un negocio
router.post("/followers", authenticateToken, followBusinessController);

// GET /api/followers - Ver negocios que el usuario sigue
router.get("/followers", authenticateToken, getUserFollowingsController);

// GET /api/followers/:businessId - Ver seguidores de un negocio
router.get("/followers/:businessId", authenticateToken, getFollowersByBusinessController);

// DELETE /api/followers/:businessId - Dejar de seguir un negocio
router.delete("/followers/:businessId", authenticateToken, unfollowBusinessController);

export default router;
