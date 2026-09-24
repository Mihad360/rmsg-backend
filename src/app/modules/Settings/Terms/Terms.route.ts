import express from "express";
import auth from "../../../middlewares/auth";
import { termsControllers } from "./Terms.controller";

const router = express.Router();

router.post(
  "/create",
  auth("admin", "superAdmin"),
  termsControllers.createTerms,
);
router.get("/", termsControllers.getAllTerms);
router.patch(
  "/update",
  auth("admin", "superAdmin"),
  termsControllers.updateTerms,
);

export const TermsRoutes = router;
