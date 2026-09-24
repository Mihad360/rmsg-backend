import express from "express";
import auth from "../../middlewares/auth";
import { memberControllers } from "./member.controller";

const router = express.Router();

router.post(
  "/choose-mother/:motherTreeMemberId",
  auth("user", "admin", "superAdmin"),
  memberControllers.requestToJoinMotherTree,
);
router.post(
  "/remove-child/:memberId",
  auth("admin", "superAdmin"),
  memberControllers.removeUserFromTree,
);
router.post(
  "/add-child/:userId/:motherMemberId",
  auth("admin", "superAdmin"),
  memberControllers.addUserToTree,
);

export const memberRoutes = router;
