import express from "express";
import auth from "../../../middlewares/auth";
import { privacyControllers } from "./Privacy.controller";

const router = express.Router();

// router.get("/policy", privacyControllers.htmlRoute);
// router.get("/app-instruction", privacyControllers.appInstruction);
router.get("/", privacyControllers.getAllPrivacy);
router.post(
  "/create",
  auth("admin", "superAdmin"),
  privacyControllers.createPrivacy,
);
router.patch(
  "/update",
  auth("admin", "superAdmin"),
  privacyControllers.updatePrivacy,
);

export const PrivacyRoutes = router;
