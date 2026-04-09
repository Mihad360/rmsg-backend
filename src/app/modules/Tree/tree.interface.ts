import { Types } from "mongoose";
import { IMember } from "../Member/member.interface";
import { IUser } from "../User/user.interface";

export interface ITree {
  _id?: Types.ObjectId;
  name: string;
  rootMember?: Types.ObjectId | IMember;
  totalMembers?: number;
  createdBy?: Types.ObjectId | IUser;
  pendingMembers?: Types.ObjectId[];
  isDefault?: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
