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
    message: "Request status updated successfully.",
    data: result,
  });
});

const updateRoleAccess = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const result = await superAdminServices.updateRoleAccess(userId, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User role updated successfully.",
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

const toggleBlockUser = catchAsync(async (req, res) => {
  const result = await superAdminServices.toggleBlockUser(
    req.params.userId,
    req.body.type,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: `User ${req.body.type === "block" ? "blocked" : "unblocked"} successfully.`,
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.params.id;
  const result = await superAdminServices.deleteUser(userId);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User account deleted successfully.",
    data: result,
  });
});

export const superAdminControllers = {
  updateRequestStatus,
  updateRoleAccess,
  getDashboardStats,
  toggleBlockUser,
  deleteUser,
};
