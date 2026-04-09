import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { UserModel } from "../User/user.model";
import { BannerImageModel } from "./banner.model";

const uploadBanner = async (user: JwtPayload, file: Express.Multer.File) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  if (!file) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Banner image is required.");
  }

  // upload image
  const result = await sendFileToCloudinary(
    file.buffer,
    file.originalname,
    file.mimetype,
  );

  if (!result?.secure_url) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Image upload failed.",
    );
  }

  // find last banner to calculate next activateAt
  const lastBanner = await BannerImageModel.findOne({ isDeleted: false })
    .sort({ activateAt: -1 })
    .lean();

  const now = new Date();
  let activateAt: Date;
  let isActive: boolean;

  if (!lastBanner) {
    // first banner ever → active immediately
    activateAt = now;
    isActive = true;
  } else {
    // next banner activates 2 months after the last scheduled one
    const base =
      lastBanner.activateAt && lastBanner.activateAt > now
        ? lastBanner.activateAt
        : now;
    activateAt = new Date(base);
    activateAt.setMonth(activateAt.getMonth() + 2);
    isActive = false;
  }

  const banner = await BannerImageModel.create({
    uploadedBy: user.user,
    imageUrl: result.secure_url,
    activateAt,
    isActive,
  });

  return banner;
};

const getActiveBanner = async () => {
  const now = new Date();

  // cron handles activation — we just return the isActive: true banner
  const activeBanner = await BannerImageModel.findOne({
    isActive: true,
    isDeleted: false,
  }).lean();

  if (!activeBanner) {
    throw new AppError(HttpStatus.NOT_FOUND, "No active banner found.");
  }

  // verify this active banner is still within its 2 month window
  const twoMonthsAfterActivation = new Date(activeBanner?.activateAt);
  twoMonthsAfterActivation.setMonth(twoMonthsAfterActivation.getMonth() + 2);

  if (now > twoMonthsAfterActivation) {
    // banner has expired but cron hasn't run yet — return it anyway
    // cron will fix it on next run, we don't mutate here
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "Active banner has expired. Next banner not yet activated.",
    );
  }

  return activeBanner;
};

export const bannerServices = {
  uploadBanner,
  getActiveBanner,
};
