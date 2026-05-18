import express from "express";
import auth from "../../middlewares/auth";
import { memberControllers } from "./member.controller";

const router = express.Router();

router.post(
  "/choose-mother/:motherTreeMemberId",
  auth("user", "admin"),
  memberControllers.requestToJoinMotherTree,
);
router.post(
  "/remove-child/:memberId",
  auth("superAdmin"),
  memberControllers.removeUserFromTree,
);
router.post(
  "/add-child/:userId/:motherMemberId",
  auth("superAdmin"),
  memberControllers.addUserToTree,
);

export const memberRoutes = router;
