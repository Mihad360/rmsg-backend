import { Types } from "mongoose";
import { IUser } from "../User/user.interface";

export type AnnouncementStatus =
  | "pending"
  | "approved"
  | "declined"
  | "in_progress"; // approved + currently active/displaying

export type AnnouncementTargetType = "all" | "group";

export interface IAnnouncementGroupFilter {
  gender?: "male" | "female";
  ageRange?: { min?: number; max?: number };
  employmentStatus?: "employed" | "unemployed";
  educationLevel?: "college" | "school";
}

export interface IAnnouncement {
  _id?: Types.ObjectId;
  createdBy: Types.ObjectId | IUser;
  title: string;
  bannerUrl?: string;
  description?: string;
  status?: AnnouncementStatus;
  declineReason?: string;

  // targeting
  targetType?: AnnouncementTargetType; // "all" | "group"
  groupFilter?: IAnnouncementGroupFilter | null; // when targetType = "group"
  targetUsers?: Types.ObjectId[]; // specific selected users

  createdAt?: Date;
  updatedAt?: Date;
}
