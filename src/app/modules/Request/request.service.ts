import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { IRequest } from "./request.interface";
import AppError from "../../erros/AppError";
import { RequestModel } from "./request.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { Types } from "mongoose";
import QueryBuilder from "../../../builder/QueryBuilder";

const createRequest = async (
  user: JwtPayload,
  payload: IRequest,
  files?: {
    cv?: Express.Multer.File[];
    certificate?: Express.Multer.File[];
  },
) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const existingPending = await RequestModel.findOne({
    user: user.user,
    type: payload.type,
    status: "pending",
    isDraft: false,
  }).lean();

  if (existingPending) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `You already have a pending ${payload.type} request.`,
    );
  }

  // Upload CV
  let cvUrl: string | undefined;
  if (files?.cv?.[0]) {
    const cvFile = files.cv[0];
    const cvResult = await sendFileToCloudinary(
      cvFile.buffer,
      cvFile.originalname,
      cvFile.mimetype,
    );
    cvUrl = cvResult.secure_url;
  }

  // Upload Certificate
  let certificateUrl: string | undefined;
  if (files?.certificate?.[0]) {
    const certFile = files.certificate[0];
    const certResult = await sendFileToCloudinary(
      certFile.buffer,
      certFile.originalname,
      certFile.mimetype,
    );
    certificateUrl = certResult.secure_url;
  }

  const request = await RequestModel.create({
    ...payload,
    user: user.user,
    status: "pending",
    isDraft: false,
    ...(cvUrl && { cvUrl }),
    ...(certificateUrl && { certificateUrl }),
  });

  return request;
};

const getAllRequests = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "user not found.");
  }

  let filter = {};

  if (isUserExist.role === "superAdmin") {
    filter = {}; // sees all
  } else if (isUserExist.role === "admin") {
    throw new AppError(HttpStatus.FORBIDDEN, "Access denied.");
  } else {
    filter = { user: userId }; // regular user sees only their own
  }

  const baseQuery = RequestModel.find(filter)
    .populate("user", "_id name profileImage email")
    .sort({ createdAt: -1 });

  const requests = new QueryBuilder(baseQuery, query)
    .search(["bio", "jobSpec", "type"])
    .filter()
    .paginate()
    .fields();

  const meta = await requests.countTotal();
  const result = await requests.modelQuery;
  return { meta, result };
};

export const requestServices = {
  createRequest,
  getAllRequests,
};
