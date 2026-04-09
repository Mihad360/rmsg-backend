import { Schema, model } from "mongoose";
import { IBannerImage } from "./banner.interface";

const bannerImageSchema = new Schema<IBannerImage>(
  {
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    activateAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: false,
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

export const BannerImageModel = model<IBannerImage>(
  "BannerImage",
  bannerImageSchema,
);
