// notification.routes.ts

import express from "express";
import { notificationControllers } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("user", "admin", "superAdmin"),
  notificationControllers.getMyNotifications,
);

router.patch(
  "/:id/read",
  auth("user", "admin", "superAdmin"),
  notificationControllers.markAsRead,
);

router.patch(
  "/read-all",
  auth("user", "admin", "superAdmin"),
  notificationControllers.markAllAsRead,
);

router.get(
  "/unread-count",
  auth("user", "admin", "superAdmin"),
  notificationControllers.getUnreadCount,
);

export const notificationRoutes = router;
