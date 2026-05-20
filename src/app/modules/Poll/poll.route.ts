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
  auth("superAdmin", "user"),
  pollControllers.getPollAnswers,
);
router.get(
  "/:pollId/results",
  auth("superAdmin"),
  pollControllers.getPollResults,
);

router.post(
  "/:pollId/answer",
  auth("user", "admin", "superAdmin"),
  pollControllers.answerPoll,
);
router.post("/create", auth("superAdmin"), pollControllers.createPoll);
router.patch(
  "/:pollId/update",
  auth("superAdmin", "user"),
  pollControllers.updatePoll,
);
router.delete(
  "/:pollId/delete",
  auth("superAdmin", "user"),
  pollControllers.deletePoll,
);

export const pollRoutes = router;
