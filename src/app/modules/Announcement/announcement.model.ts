import { Schema, model } from "mongoose";
import {
  IAnnouncement,
  IAnnouncementGroupFilter,
} from "./announcement.interface";

const announcementGroupFilterSchema = new Schema<IAnnouncementGroupFilter>(
  {
    gender: {
      type: String,
      enum: ["male", "female"],
      default: null,
    },
    ageRange: {
      min: {
        type: Number,
        default: null,
      },
      max: {
        type: Number,
        default: null,
      },
    },
    employmentStatus: {
      type: String,
      enum: ["employed", "unemployed"],
      default: null,
    },
    educationLevel: {
      type: String,
      enum: ["college", "school"],
      default: null,
    },
  },
  { _id: false },
);

const announcementSchema = new Schema<IAnnouncement>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    bannerUrl: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "declined", "in_progress"],
      default: "pending",
    },

    declineReason: {
      type: String,
      default: null,
    },

    // targeting
    targetType: {
      type: String,
      enum: ["all", "group"],
      default: "all",
    },

    groupFilter: {
      type: announcementGroupFilterSchema,
      default: null, // 👈 important
    },

    targetUsers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [], // 👈 always array
    },
  },
  {
    timestamps: true,
  },
);

export const AnnouncementModel = model<IAnnouncement>(
  "Announcement",
  announcementSchema,
);
