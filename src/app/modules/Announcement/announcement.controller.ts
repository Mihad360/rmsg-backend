import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { announcementServices } from "./announcement.service";

const createAnnouncement = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const result = await announcementServices.createAnnouncement(
    user,
    req.body,
    files,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Announcement created successfully",
    data: result,
  });
});

const getAnnouncements = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await announcementServices.getAnnouncements(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Announcements retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachAnnouncement = catchAsync(async (req, res) => {
  const id = req.params.announcementId;
  const result = await announcementServices.getEachAnnouncement(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Announcement retrieved successfully",
    data: result,
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
    message: "Announcement status updated successfully",
    data: result,
  });
});

const deleteAnnouncement = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const announcementId = req.params.announcementId;

  const result = await announcementServices.deleteAnnouncement(
    announcementId,
    user,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Announcement deleted successfully",
    data: result,
  });
});

const getMyAnnouncementRequests = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await announcementServices.getMyAnnouncementRequests(
    user,
    req.query,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Announcement requests retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

export const announcementControllers = {
  createAnnouncement,
  getAnnouncements,
  getMyAnnouncementRequests,
  updateAnnouncementStatus,
  getEachAnnouncement,
  deleteAnnouncement,
};
