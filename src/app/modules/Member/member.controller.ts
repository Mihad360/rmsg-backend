import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { memberServices } from "./member.service";
import { JwtPayload } from "../../interface/global";

const requestToJoinMotherTree = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const motherTreeMemberId = req.params.motherTreeMemberId;
  const result = await memberServices.requestToJoinMotherTree(
    user,
    motherTreeMemberId,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const removeUserFromTree = catchAsync(async (req, res) => {
  const memberId = req.params.memberId;
  const result = await memberServices.removeUserFromTree(memberId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const addUserToTree = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const motherMemberId = req.params.motherMemberId;
  const result = await memberServices.addUserToTree(userId, motherMemberId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

export const memberControllers = {
  requestToJoinMotherTree,
  removeUserFromTree,
  addUserToTree,
};
