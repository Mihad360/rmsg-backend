import { Types } from "mongoose";
import { ITree } from "../Tree/tree.interface";
import { IUser } from "../User/user.interface";

export type MemberRole = "GrandFather" | "Father" | "Son" | "SonsSon";

export interface IMember {
  _id?: Types.ObjectId;

  // which tree
  tree: Types.ObjectId | ITree;

  // lineage
  parent?: Types.ObjectId | IMember;
  level?: number; // 0 = root, auto calculated from parent

  // spouse
  spouseOf?: Types.ObjectId | IMember;
  spouseGroupId?: string;

  // user linkage
  linkedUser?: Types.ObjectId | IUser;

  // auto derived from level on backend — never sent by client
  // generationRole?: "GrandFather" | "Father" | "Son" | "SonsSon";

  // set manually on creation
  relationType: "blood" | "spouse" | "adopted";
  placementStatus: "placed" | "floating";

  isTreeRoot?: boolean;
  label: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
