import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { bannerControllers } from "./banner.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get(
  "/",
  auth("user", "admin", "superAdmin"),
  bannerControllers.getActiveBanner,
);
router.post(
  "/upload",
  auth("superAdmin"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  bannerControllers.uploadBanner,
);
router.delete(
  "/:bannerId/delete",
  auth("superAdmin"),
  bannerControllers.deleteBanner,
);

export const bannerRoutes = router;
