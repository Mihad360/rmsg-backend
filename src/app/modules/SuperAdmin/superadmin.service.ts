import HttpStatus from "http-status";
import { RequestStatus } from "../Request/request.interface";
import { RequestModel } from "../Request/request.model";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";

const updateRequestStatus = async (
  requestId: string,
  payload: {
    status: RequestStatus;
    declineReason?: string;
    additionalInfoRequest?: string;
  },
) => {
  const request = await RequestModel.findById(requestId).lean();
  if (!request) {
    throw new AppError(HttpStatus.NOT_FOUND, "Request not found.");
  }

  if (payload.status === "declined" && !payload.declineReason) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Decline reason is required when declining a request.",
    );
  }

  if (
    payload.status === "additional_info_required" &&
    !payload.additionalInfoRequest
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Additional info message is required.",
    );
  }

  const updated = await RequestModel.findByIdAndUpdate(
    requestId,
    {
      status: payload.status,
      ...(payload.declineReason && { declineReason: payload.declineReason }),
      ...(payload.additionalInfoRequest && {
        additionalInfoRequest: payload.additionalInfoRequest,
      }),
    },
    { new: true },
  ).lean();

  return updated;
};

const allowedRoles = ["admin", "user"];

const updateRoleAccess = async (userId: string, payload: { role: string }) => {
  if (!allowedRoles.includes(payload.role)) {
    throw new Error("Invalid role");
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { role: payload.role },
    { new: true },
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

export const superAdminServices = {
  updateRequestStatus,
  updateRoleAccess,
};
