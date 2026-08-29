import { Schema, model } from "mongoose";
import { IAnnouncement } from "./announcement.interface";

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

    targetUsers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
