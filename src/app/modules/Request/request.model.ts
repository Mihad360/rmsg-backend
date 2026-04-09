import { Schema, model } from "mongoose";
import { IRequest } from "./request.interface";

const ContactInfoSchema = new Schema(
  {
    phone: String,
    email: String,
    linkedin: String,
    address: String,
  },
  { _id: false },
);

const EducationSchema = new Schema(
  {
    school: String,
    degree: String,
    major: String,
    from: Date,
    to: Date,
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false },
);

const ExperienceSchema = new Schema(
  {
    company: String,
    position: String,
    from: Date,
    to: Date,
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false },
);

const RequestSchema = new Schema<IRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["job", "volunteering", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "additional_info_required"],
      default: "pending",
    },
    isDraft: { type: Boolean, default: true },
    bio: String,
    jobSpec: String,
    contact: ContactInfoSchema,
    education: [EducationSchema],
    experience: [ExperienceSchema],
    cvUrl: { type: String, default: null },
    certificateUrl: { type: String, default: null },
    adminNote: { type: String, default: null },
    additionalInfoRequest: { type: String, default: null },
    declineReason: { type: String, default: null },
  },
  { timestamps: true },
);

export const RequestModel = model<IRequest>("Request", RequestSchema);
