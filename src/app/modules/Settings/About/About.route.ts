import express from "express";
import auth from "../../../middlewares/auth";
import { aboutControllers } from "./About.controller";

const router = express.Router();

router.post(
  "/create",
  auth("admin", "superAdmin"),
  aboutControllers.createAbout,
);
router.get("/", aboutControllers.getAllAbout);
router.patch(
  "/update",
  auth("admin", "superAdmin"),
  aboutControllers.updateAbout,
);

export const AboutRoutes = router;
