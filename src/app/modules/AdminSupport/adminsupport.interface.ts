import { Types } from "mongoose";
import { IUser } from "../User/user.interface";

export type SupportStatus = "open" | "in_progress" | "resolved";

export interface IAdminSupport {
  _id?: Types.ObjectId;
  user: Types.ObjectId | IUser;
  subject?: string;
  message: string;
  status?: SupportStatus;
  adminReply?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
