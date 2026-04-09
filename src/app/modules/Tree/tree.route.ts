import express from "express";
import auth from "../../middlewares/auth";
import { treeControllers } from "./tree.controller";

const router = express.Router();

router.get(
  "/me",
  auth("user", "superAdmin", "admin"),
  treeControllers.getMyTree,
);
router.get(
  "/full",
  auth("user", "superAdmin", "admin"),
  treeControllers.getFullTree,
);
router.get(
  "/:memberId",
  auth("admin", "superAdmin", "user"),
  treeControllers.getTree,
);

export const treeRoutes = router;
