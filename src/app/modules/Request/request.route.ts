import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";
import { requestControllers } from "./request.controller";

const router = express.Router();

router.get(
  "/",
  auth("admin", "user", "superAdmin"),
  requestControllers.getAllRequests,
);
router.post(
  "/create",
  auth("admin", "user", "superAdmin"),
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  requestControllers.createRequest,
);

export const requestRoutes = router;
