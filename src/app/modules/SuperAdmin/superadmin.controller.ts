import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { superAdminServices } from "./superadmin.service";

const updateRequestStatus = catchAsync(async (req, res) => {
  const requestId = req.params.requestId;
  const result = await superAdminServices.updateRequestStatus(
    requestId,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const updateRoleAccess = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const result = await superAdminServices.updateRoleAccess(userId, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const getDashboardStats = catchAsync(async (req, res) => {
  const result = await superAdminServices.getDashboardStats(req.query);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully.",
    data: result,
  });
});

export const superAdminControllers = {
  updateRequestStatus,
  updateRoleAccess,
  getDashboardStats,
};
