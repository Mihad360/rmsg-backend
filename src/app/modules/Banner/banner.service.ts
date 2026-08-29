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

  // find latest scheduled banner
  const lastBanner = await BannerImageModel.findOne({
    isDeleted: false,
  })
    .sort({ activateAt: -1 })
    .lean();

  const now = new Date();

  let activateAt: Date;
  let isActive = false;

  if (!lastBanner) {
    // first banner
    activateAt = now;
    isActive = true;
  } else {
    activateAt = new Date(lastBanner.activateAt!);
    activateAt.setMonth(activateAt.getMonth() + 1);
  }

  const banner = await BannerImageModel.create({
    uploadedBy: user.user,
    imageUrl: result.secure_url,
    activateAt,
    isActive,
  });

  return banner;
};

const getAllBanners = async () => {
  const banners = await BannerImageModel.find({
    isDeleted: false,
  })
    .sort({ activateAt: 1 }) // earliest activation first
    .lean();

  return banners;
};

const getActiveBanner = async () => {
  const activeBanner = await BannerImageModel.findOne({
    isDeleted: false,
    isActive: true,
  }).lean();

  if (!activeBanner) {
    throw new AppError(HttpStatus.NOT_FOUND, "No active banner found.");
  }

  return activeBanner;
};

const deleteBanner = async (user: JwtPayload, bannerId: string) => {
  const existingUser = await UserModel.findById(user.user);

  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const banner = await BannerImageModel.findOne({
    _id: bannerId,
    isDeleted: false,
  });

  if (!banner) {
    throw new AppError(HttpStatus.NOT_FOUND, "Banner not found.");
  }

  await BannerImageModel.findByIdAndUpdate(bannerId, {
    isDeleted: true,
    isActive: false,
  });

  return {
    success: true,
    message: "Banner deleted successfully.",
  };
};

export const bannerServices = {
  uploadBanner,
  getActiveBanner,
  deleteBanner,
  getAllBanners,
};
