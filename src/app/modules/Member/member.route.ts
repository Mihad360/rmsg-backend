import express from "express";
import auth from "../../middlewares/auth";
import { memberControllers } from "./member.controller";

const router = express.Router();

router.post(
  "/choose-mother/:motherTreeMemberId",
  auth("user", "admin"),
  memberControllers.requestToJoinMotherTree,
);

export const memberRoutes = router;
