import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { bannerServices } from "./banner.service";

const uploadBanner = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const file = req.file as Express.Multer.File;
  const result = await bannerServices.uploadBanner(user, file);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const getActiveBanner = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await bannerServices.getActiveBanner(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const deleteBanner = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await bannerServices.deleteBanner(
    user,
    req.params.bannerId as string,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

export const bannerControllers = {
  uploadBanner,
  getActiveBanner,
  deleteBanner,
};
