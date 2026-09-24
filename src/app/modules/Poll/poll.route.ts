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
router.get(
  "/:pollId/answers",
  auth("admin", "superAdmin", "user"),
  pollControllers.getPollAnswers,
);
router.get(
  "/:pollId/results",
  auth("admin", "superAdmin"),
  pollControllers.getPollResults,
);

router.post(
  "/:pollId/answer",
  auth("user", "admin", "superAdmin"),
  pollControllers.answerPoll,
);
router.post("/create", auth("admin", "superAdmin"), pollControllers.createPoll);
router.patch(
  "/:pollId/update",
  auth("admin", "superAdmin", "user"),
  pollControllers.updatePoll,
);
router.delete(
  "/:pollId/delete",
  auth("admin", "superAdmin", "user"),
  pollControllers.deletePoll,
);

export const pollRoutes = router;
