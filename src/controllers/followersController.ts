import {
  followBusiness,
  getFollowersByBusinessId,
  getUserFollowings,
  unfollowBusiness
} from "../services/firestoreService.js";

export const followBusinessController = async (req, res) => {
  try {
    const userId = req.body?.userId;
    const businessId = req.body?.businessId;

    if (!userId || !businessId) {
      return res.status(400).json({ error: "userId y businessId son requeridos" });
    }

    const result = await followBusiness(userId, businessId);
    return res.status(201).json(result);
  } catch (error) {
    const msg = error?.message || "Error siguiendo negocio";
    const code = /no encontrado/i.test(msg)
      ? 404
      : /requerido/i.test(msg)
        ? 400
        : 500;
    return res.status(code).json({ error: msg });
  }
};

export const getFollowersByBusinessController = async (req, res) => {
  try {
    const businessId = req.params?.businessId;
    const followers = await getFollowersByBusinessId(businessId);
    return res.status(200).json({ followers, total: followers.length });
  } catch (error) {
    const msg = error?.message || "Error obteniendo seguidores";
    const code = /no encontrado/i.test(msg)
      ? 404
      : /requerido/i.test(msg)
        ? 400
        : 500;
    return res.status(code).json({ error: msg });
  }
};

export const getUserFollowingsController = async (req, res) => {
  try {
    const userId = req.query?.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }
    const followings = await getUserFollowings(userId);
    return res.status(200).json({ followings, total: followings.length });
  } catch (error) {
    const msg = error?.message || "Error obteniendo seguimientos";
    return res.status(500).json({ error: msg });
  }
};

export const unfollowBusinessController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const businessId = req.params?.businessId;

    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }

    const result = await unfollowBusiness(userId, businessId);
    return res.status(200).json(result);
  } catch (error) {
    const msg = error?.message || "Error dejando de seguir";
    const code = /no estás/i.test(msg)
      ? 404
      : /requerido/i.test(msg)
        ? 400
        : 500;
    return res.status(code).json({ error: msg });
  }
};
