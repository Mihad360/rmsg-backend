import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userServices } from "./user.service";
import { JwtPayload } from "../../interface/global";

const getMe = catchAsync(async (req, res) => {
  const result = await userServices.getMe(req.user as JwtPayload);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const result = await userServices.getUsers(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await userServices.getEachUser(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const editProfile = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = user.user as string;

  const files = req.files as {
    image?: Express.Multer.File[];
    cv?: Express.Multer.File[];
    certificates?: Express.Multer.File[];
  };

  const result = await userServices.editProfile(id, req.body, files);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await userServices.deleteUser(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const userControllers = {
  getMe,
  getUsers,
  editProfile,
  getEachUser,
  deleteUser,
};
