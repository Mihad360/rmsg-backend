import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { announcementServices } from "./announcement.service";

const createAnnouncement = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const file = req.file as Express.Multer.File;
  const result = await announcementServices.createAnnouncement(
    user,
    req.body,
    file,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const getAnnouncements = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await announcementServices.getAnnouncements(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    meta: result.meta,
    data: result.result,
  });
});

const updateAnnouncementStatus = catchAsync(async (req, res) => {
  const announcementId = req.params.announcementId;
  const result = await announcementServices.updateAnnouncementStatus(
    announcementId,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

export const announcementControllers = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncementStatus,
};
