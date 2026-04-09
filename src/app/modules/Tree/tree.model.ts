import { Schema, model } from "mongoose";
import { ITree } from "./tree.interface";

const TreeSchema = new Schema<ITree>(
  {
    name: {
      type: String,
      required: true,
    },
    rootMember: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    totalMembers: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // users who selected this tree but not placed yet
    // query IMember placementStatus floating as alternative
    pendingMembers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    // true only for Mohammad root tree, seeded at startup
    isDefault: {
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

export const TreeModel = model<ITree>("Tree", TreeSchema);
