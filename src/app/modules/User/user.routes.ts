import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { userControllers } from "./user.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get("/", userControllers.getUsers);
router.get("/me", auth("admin", "user", "superAdmin"), userControllers.getMe);
router.get("/:id", userControllers.getEachUser);
router.patch(
  "/edit-profile",
  auth("admin", "user", "superAdmin"),

  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "cv", maxCount: 1 },
    { name: "certificates", maxCount: 10 },
  ]),

  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  userControllers.editProfile,
);

export const userRoutes = router;
