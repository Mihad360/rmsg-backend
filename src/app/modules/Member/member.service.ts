import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import AppError from "../../erros/AppError";
import { MemberModel } from "../Member/member.model";
import { TreeModel } from "../Tree/tree.model";
import { Types } from "mongoose";
import { UserModel } from "../User/user.model";

const requestToJoinMotherTree = async (
  user: JwtPayload,
  motherTreeMemberId: string,
) => {
  const userId = new Types.ObjectId(user.user);

  // ── 1. Find the requesting user (added `name` to select)
  const existingUser = await UserModel.findById(userId)
    .select("name treeJoinStatus linkedMember motherTree")
    .lean();

  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  // ── 2. Prevent re-joining if already placed or pending
  if (existingUser.treeJoinStatus === "placed") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "User is already placed in a tree.",
    );
  }

  if (existingUser.treeJoinStatus === "pending_placement") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "User already has a pending join request.",
    );
  }
  console.log(motherTreeMemberId);
  // ── 3. Find the selected mother tree member
  //       Must be a tree root, placed, and not deleted
  const motherMember = await MemberModel.findOne({
    _id: new Types.ObjectId(motherTreeMemberId),
    isDeleted: false,
    placementStatus: "placed",
  }).lean();

  if (!motherMember) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "Selected mother tree root member not found.",
    );
  }

  // ── 4. Confirm the tree itself exists and is not deleted
  const tree = await TreeModel.findOne({
    _id: motherMember.tree,
    isDeleted: false,
  }).lean();

  if (!tree) {
    throw new AppError(HttpStatus.NOT_FOUND, "Associated tree not found.");
  }

  // ── 5. Create the new Member node under the root
  const newMember = await MemberModel.create({
    tree: motherMember.tree,
    parent: motherMember._id, // child of the root member
    linkedUser: userId,
    label: existingUser.name, // ← now correctly populated
    level: (motherMember.level ?? 0) + 1,
    relationType: "blood",
    placementStatus: "placed",
    isTreeRoot: false,
    isDeleted: false,
  });

  // ── 6. Update user — link member, set motherTree, mark placed
  //       Also pull from pendingMembers in case they were queued
  await Promise.all([
    UserModel.findByIdAndUpdate(userId, {
      linkedMember: newMember._id,
      motherTree: motherMember.tree,
      treeJoinStatus: "placed",
    }),
    TreeModel.findByIdAndUpdate(motherMember.tree, {
      $inc: { totalMembers: 1 },
    }),
  ]);

  return newMember;
};

export const memberServices = {
  requestToJoinMotherTree,
};
