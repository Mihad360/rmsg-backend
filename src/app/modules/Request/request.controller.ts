import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { requestServices } from "./request.service";

const createRequest = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;

  const files = req.files as {
    cv?: Express.Multer.File[];
    certificate?: Express.Multer.File[];
  };

  const result = await requestServices.createRequest(user, req.body, files);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Request created successfully",
    data: result,
  });
});

const getAllRequests = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await requestServices.getAllRequests(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    meta: result.meta,
    data: result.result,
  });
});

export const requestControllers = {
  createRequest,
  getAllRequests,
};
