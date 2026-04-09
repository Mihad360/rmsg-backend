import { Schema, model } from "mongoose";
import { IMember } from "./member.interface";

const MemberSchema = new Schema<IMember>(
  {
    tree: {
      type: Schema.Types.ObjectId,
      ref: "Tree",
      required: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    linkedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    label: {
      type: String,
    },

    // auto derived from level on backend — never sent by client
    // generationRole: {
    //   type: String,
    //   enum: ["GrandFather", "Father", "Son", "SonsSon"],
    // },

    level: {
      type: Number,
      default: 0,
    },

    // spouse
    spouseOf: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    spouseGroupId: {
      type: String,
      default: null,
    },

    // set on creation
    relationType: {
      type: String,
      enum: ["blood", "spouse", "adopted"],
      required: true,
      default: "blood",
    },
    placementStatus: {
      type: String,
      enum: ["placed", "floating"],
      default: "floating",
    },

    // appears in "Select mother tree" screen
    isTreeRoot: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const MemberModel = model<IMember>("Member", MemberSchema);
