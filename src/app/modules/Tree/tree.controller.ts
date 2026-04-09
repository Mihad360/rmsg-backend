import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { treeServices } from "./tree.service";
import { JwtPayload } from "../../interface/global";

const getMyTree = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await treeServices.getMyTree(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const getTree = catchAsync(async (req, res) => {
  const memberId = req.params.memberId;
  const result = await treeServices.getTree(memberId, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const getFullTree = catchAsync(async (req, res) => {
  const result = await treeServices.getFullTree();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

export const treeControllers = {
  getTree,
  getFullTree,
  getMyTree,
};
