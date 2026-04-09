// poll.routes.ts
import express from "express";
import auth from "../../middlewares/auth";
import { pollControllers } from "./poll.controller";

const router = express.Router();

router.get(
  "/",
  auth("superAdmin", "admin", "user"),
  pollControllers.getAllPolls,
);
router.get("/:pollId/answers", auth("superAdmin"), pollControllers.getPollAnswers);

router.post("/:pollId/answer", auth("user"), pollControllers.answerPoll);
router.post("/create", auth("superAdmin"), pollControllers.createPoll);

export const pollRoutes = router;
