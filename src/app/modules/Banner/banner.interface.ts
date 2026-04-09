import { Types } from "mongoose";
import { IUser } from "../User/user.interface";

export interface IBannerImage {
  _id?: Types.ObjectId;
  uploadedBy: Types.ObjectId | IUser;
  imageUrl: string;
  activateAt: Date; // when this banner becomes active (2-month rotation)
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
