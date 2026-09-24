import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { IRequest } from "./request.interface";
import AppError from "../../erros/AppError";
import { RequestModel } from "./request.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { Types } from "mongoose";
import QueryBuilder from "../../../builder/QueryBuilder";
import { INotification } from "../Notification/notification.interface";
import { createMultipleNotifications } from "../Notification/notification.utils";
import { sendPushNotifications } from "../../utils/firebase/notification";

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

  // 🔥 Send In-App Notifications & FCM Push Notifications to Admins and SuperAdmins
  try {
    const admins = await UserModel.find({
      role: { $in: ["admin", "superAdmin"] },
      isDeleted: false,
    }).select("_id fcmToken");

    if (admins.length > 0) {
      const typeLabel =
        payload.type === "job"
          ? "Job"
          : payload.type === "volunteering"
          ? "Volunteering"
          : "New";
      const userName = existingUser.name || existingUser.email || "A user";
      const notifTitle = `New ${typeLabel} Request`;
      const notifMessage = `${userName} has submitted a new ${payload.type} request.`;

      const notifications: INotification[] = admins.map((admin) => ({
        sender: new Types.ObjectId(user.user),
        recipient: admin._id,
        type: "job_request",
        title: notifTitle,
        message: notifMessage,
      }));

      await createMultipleNotifications(notifications);

      const adminTokens = admins
        .flatMap((admin) => admin.fcmToken || [])
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0);

      if (adminTokens.length > 0) {
        await sendPushNotifications(adminTokens, notifTitle, notifMessage);
      }
    }
  } catch (error) {
    console.error("Failed to send job request notification to admins:", error);
  }

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

  if (isUserExist.role === "superAdmin" || isUserExist.role === "admin") {
    filter = {}; // sees all
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
