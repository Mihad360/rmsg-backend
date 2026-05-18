import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { UserModel } from "../User/user.model";
import { AnnouncementStatus, IAnnouncement } from "./announcement.interface";
import { AnnouncementModel } from "./announcement.model";
import QueryBuilder from "../../../builder/QueryBuilder";
import { Types } from "mongoose";

const createAnnouncement = async (
  user: JwtPayload,
  payload: IAnnouncement,
  file?: Express.Multer.File,
) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  if (payload.targetType === "group") {
    if (!payload.targetUsers || payload.targetUsers.length === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "targetUsers is required when targetType is group",
      );
    }

    // remove groupFilter completely
    // payload.groupFilter = null;
  }

  if (payload.targetType === "all") {
    // payload.groupFilter = null;
    payload.targetUsers = [];
  }

  // upload before transaction — cloudinary is external
  let bannerUrl: string | undefined;
  if (file) {
    const result = await sendFileToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    bannerUrl = result.secure_url;
  }

  const announcement = await AnnouncementModel.create([
    {
      ...payload,
      createdBy: user.user,
      status: "pending",
      ...(bannerUrl && { bannerUrl }),
    },
  ]);
  return announcement;
};

const getAnnouncements = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const existingUser = await UserModel.findById(user.user).lean();

  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const filter: Record<string, unknown> = {
    status: { $in: ["pending", "approved", "in_progress"] },
    isDeleted: false,
  };

  if (query.type === "my") {
    filter.createdBy = new Types.ObjectId(user.user);
  } else {
    filter.$or = [
      { targetType: "all" },
      {
        targetType: "group",
        targetUsers: new Types.ObjectId(user.user),
      },
    ];
  }

  // remove custom query param
  const modifiedQuery = { ...query };
  delete modifiedQuery.type;

  const baseQuery = AnnouncementModel.find(filter)
    .populate("createdBy", "_id name profileImage")
    .sort({ createdAt: -1 });

  const announcements = new QueryBuilder(baseQuery, modifiedQuery)
    .search(["title", "description"])
    .filter()
    .paginate()
    .fields();

  const meta = await announcements.countTotal();
  const result = await announcements.modelQuery;

  return { meta, result };
};

const getEachAnnouncement = async (announcementId: string) => {
  const announcement = await AnnouncementModel.findById(announcementId);
  if (!announcement) {
    throw new AppError(HttpStatus.NOT_FOUND, "Announcement not found.");
  }

  return announcement;
};

const updateAnnouncementStatus = async (
  announcementId: string,
  payload: {
    status: AnnouncementStatus;
    declineReason?: string;
  },
) => {
  const announcement = await AnnouncementModel.findById(announcementId).lean();
  if (!announcement) {
    throw new AppError(HttpStatus.NOT_FOUND, "Announcement not found.");
  }

  // if (payload.status === "declined" && !payload.declineReason) {
  //   throw new AppError(
  //     HttpStatus.BAD_REQUEST,
  //     "Decline reason is required when declining an announcement.",
  //   );
  // }

  const updated = await AnnouncementModel.findByIdAndUpdate(
    announcementId,
    {
      status: payload.status,
      ...(payload.declineReason && { declineReason: payload.declineReason }),
    },
    { new: true },
  ).lean();

  return updated;
};

const deleteAnnouncement = async (announcementId: string, user: JwtPayload) => {
  const existingUser = await UserModel.findById(user.user).lean();

  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const announcement = await AnnouncementModel.findById(announcementId).lean();

  if (!announcement) {
    throw new AppError(HttpStatus.NOT_FOUND, "Announcement not found.");
  }

  // optional ownership check
  if (announcement.createdBy.toString() !== user.user.toString()) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not authorized to delete this announcement.",
    );
  }

  const result = await AnnouncementModel.findByIdAndUpdate(
    announcementId,
    {
      isDeleted: true,
    },
    { new: true },
  );

  return result;
};

export const announcementServices = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncementStatus,
  getEachAnnouncement,
  deleteAnnouncement,
};
