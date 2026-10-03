import express from "express";
import auth from "../../middlewares/auth";
import { superAdminControllers } from "./superadmin.controller";

const router = express.Router();

router.get(
  "/stats",
  auth("admin", "superAdmin"),
  superAdminControllers.getDashboardStats,
);
router.patch(
  "/requests/update/:requestId",
  auth("admin", "superAdmin"),
  superAdminControllers.updateRequestStatus,
);
router.patch(
  "/role/update/:userId",
  auth("admin", "superAdmin"),
  superAdminControllers.updateRoleAccess,
);
router.patch(
  "/block-unblock/:userId",
  auth("admin", "superAdmin"),
  superAdminControllers.toggleBlockUser,
);
router.delete(
  "/users/:userId",
  auth("admin", "superAdmin"),
  superAdminControllers.deleteUser,
);
router.delete(
  "/delete-account/:userId",
  auth("admin", "superAdmin"),
  superAdminControllers.deleteUser,
);

export const superAdminRoutes = router;
