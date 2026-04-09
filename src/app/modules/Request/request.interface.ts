import { Types } from "mongoose";
import { IUser } from "../User/user.interface";

export type RequestType = "job" | "volunteering" | "other";
export type RequestStatus =
  | "pending"
  | "approved"
  | "declined"
  | "additional_info_required";

export interface IEducation {
  school?: string;
  degree?: string;
  major?: string;
  from?: Date;
  to?: Date;
  isCurrent?: boolean;
}

export interface IExperience {
  company?: string;
  position?: string;
  from?: Date;
  to?: Date;
  isCurrent?: boolean;
}

export interface IContactInfo {
  phone?: string;
  email?: string;
  linkedin?: string;
  address?: string;
}

export interface IRequest {
  _id?: Types.ObjectId;
  user: Types.ObjectId | IUser;
  type: RequestType;
  status?: RequestStatus;
  isDraft?: boolean; // true while user is filling multi-step form

  // form steps — each saved independently via PATCH
  bio?: string;
  jobSpec?: string;
  contact?: IContactInfo;
  education?: IEducation[];
  experience?: IExperience[];

  cvUrl?: string; // uploaded file URL
  certificateUrl?: string;

  adminNote?: string; // keep for backward compat OR replace with ↓
  declineReason?: string; // ← ADD
  additionalInfoRequest?: string; // ← ADD
  createdAt?: Date;
  updatedAt?: Date;
}
