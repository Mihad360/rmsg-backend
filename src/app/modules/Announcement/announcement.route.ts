import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";
import { announcementControllers } from "./announcement.controller";

const router = express.Router();

router.get(
  "/",
  auth("admin", "user", "superAdmin"),
  announcementControllers.getAnnouncements,
);
router.post(
  "/create",
  auth("admin", "user", "superAdmin"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  announcementControllers.createAnnouncement,
);
router.patch(
  "/:announcementId",
  auth("admin", "superAdmin"),
  announcementControllers.updateAnnouncementStatus,
);

export const announcementRoutes = router;
