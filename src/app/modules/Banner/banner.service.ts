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

const getActiveBanner = async (user: JwtPayload) => {
  const now = new Date();

  // if super admin -> return all banners newest first
  if (user.role === "superAdmin") {
    const banners = await BannerImageModel.find({
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return banners;
  }

  // normal users -> only active banner
  const activeBanner = await BannerImageModel.findOne({
    isActive: true,
    isDeleted: false,
  }).lean();

  if (!activeBanner) {
    throw new AppError(HttpStatus.NOT_FOUND, "No active banner found.");
  }

  // verify active banner validity
  if (!activeBanner.activateAt) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Banner activation date missing.",
    );
  }

  const twoMonthsAfterActivation = new Date(activeBanner.activateAt);

  twoMonthsAfterActivation.setMonth(twoMonthsAfterActivation.getMonth() + 2);

  if (now > twoMonthsAfterActivation) {
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
