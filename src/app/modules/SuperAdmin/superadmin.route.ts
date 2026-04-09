import express from "express";
import auth from "../../middlewares/auth";
import { superAdminControllers } from "./superadmin.controller";

const router = express.Router();

router.patch(
  "/requests/update/:requestId",
  auth("admin", "user", "superAdmin"),
  superAdminControllers.updateRequestStatus,
);
router.patch(
  "/role/update/:userId",
  auth("superAdmin"),
  superAdminControllers.updateRoleAccess,
);

export const superAdminRoutes = router;
