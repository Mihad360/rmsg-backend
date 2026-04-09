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
    const hasGroupFilter =
      payload.groupFilter && Object.keys(payload.groupFilter).length > 0;
    const hasTargetUsers =
      payload.targetUsers && payload.targetUsers.length > 0;

    if (!hasGroupFilter && !hasTargetUsers) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "For group targeting, provide either groupFilter criteria or specific targetUsers.",
      );
    }
  }

  if (payload.targetType === "all") {
    payload.groupFilter = null;
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
    status: { $in: ["approved", "in_progress"] },
    $or: [
      // targeted to all
      { targetType: "all" },

      // targeted to this specific user
      {
        targetType: "group",
        targetUsers: new Types.ObjectId(user.user),
      },

      // targeted by group filter
      {
        targetType: "group",
        targetUsers: { $size: 0 },
        $and: [
          {
            $or: [
              { "groupFilter.gender": null },
              { "groupFilter.gender": existingUser.gender },
            ],
          },
          {
            $or: [
              { "groupFilter.ageRange.min": null },
              { "groupFilter.ageRange.min": { $lte: existingUser.age } },
            ],
          },
          {
            $or: [
              { "groupFilter.ageRange.max": null },
              { "groupFilter.ageRange.max": { $gte: existingUser.age } },
            ],
          },
          {
            $or: [
              { "groupFilter.employmentStatus": null },
              {
                "groupFilter.employmentStatus": existingUser.employmentStatus,
              },
            ],
          },
          {
            $or: [
              { "groupFilter.educationLevel": null },
              {
                "groupFilter.educationLevel": existingUser.educationLevel,
              },
            ],
          },
        ],
      },
    ],
  };

  const baseQuery = AnnouncementModel.find(filter)
    .populate("createdBy", "_id name profileImage")
    .sort({ createdAt: -1 });

  const announcements = new QueryBuilder(baseQuery, query)
    .search(["title", "description"])
    .filter()
    .paginate()
    .fields();

  const meta = await announcements.countTotal();
  const result = await announcements.modelQuery;

  return { meta, result };
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

  if (payload.status === "declined" && !payload.declineReason) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Decline reason is required when declining an announcement.",
    );
  }

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

export const announcementServices = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncementStatus,
};
