import { Types } from "mongoose";
import { IUser } from "../User/user.interface";

export type PollAnswerType = "selector" | "write-in";

export interface IPollOption {
  _id?: Types.ObjectId;
  text: string;
  count?: number; // incremented on each vote
}

export interface IPoll {
  _id?: Types.ObjectId;
  createdBy: Types.ObjectId | IUser;
  title: string;
  tagline?: string;
  answerType?: PollAnswerType;
  options?: IPollOption[];
  totalResponses?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// poll-answer.interface.ts
export interface IPollAnswer {
  _id?: Types.ObjectId;
  poll: Types.ObjectId;
  user: Types.ObjectId | IUser;
  optionId?: Types.ObjectId; // for selector
  answer?: string; // for write-in
  createdAt?: Date;
  updatedAt?: Date;
}
