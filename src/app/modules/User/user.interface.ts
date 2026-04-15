import { Model, Types } from "mongoose";
import { ITree } from "../Tree/tree.interface";
import { IMember } from "../Member/member.interface";

interface ProfileImage {
  path: string; // e.g., "images/1234567890-profile.jpg"
  url: string; // e.g., "http://localhost:5000/images/1234567890-profile.jpg"
}

export interface IUser {
  _id?: Types.ObjectId;

  // auth
  email: string;
  password: string;
  role: "user" | "admin" | "superAdmin";

  // profile
  name?: string;
  profileImage?: string;
  phone?: string;
  // 🌍 location (Saudi-based structure)
  address?: string; // e.g. "Building 12, Street 5"
  country?: string; // "Saudi Arabia"
  countryCode?: string; // "SA"
  region?: string; // e.g. "Riyadh Province"
  city?: string; // e.g. "Riyadh"
  district?: string; // e.g. "Al Olaya"

  dateOfBirth?: Date;
  age?: number;
  gender?: string;
  employmentStatus?: "employed" | "unemployed";
  education?: string;
  educationLevel?: string;
  universityName?: string;
  fieldOfWork?: string;
  spouseName?: string;
  spousePhone?: string;
  linkedinLink?: string;

  // tree
  motherTree?: Types.ObjectId | ITree;
  linkedMember?: Types.ObjectId | IMember;
  treeJoinStatus?: "pending_placement" | "placed" | "unlinked";

  // admin
  adminScope?: Types.ObjectId | IMember;
  adminGrantedBy?: Types.ObjectId | IUser;

  // system
  fcmToken?: string[];
  isActive?: boolean;
  otp?: string;
  expiresAt?: Date;
  isVerified?: boolean;
  isDeleted?: boolean;
  passwordChangedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserInterface extends Model<IUser> {
  isUserExistByEmail(email: string): Promise<IUser>;
  compareUserPassword(
    payloadPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  newHashedPassword(newPassword: string): Promise<string>;
  isOldTokenValid: (
    passwordChangedTime: Date,
    jwtIssuedTime: number,
  ) => Promise<boolean>;
  isJwtIssuedBeforePasswordChange(
    passwordChangeTimeStamp: Date,
    jwtIssuedTimeStamp: number,
  ): boolean;
  isUserExistByCustomId(email: string): Promise<IUser>;
}
