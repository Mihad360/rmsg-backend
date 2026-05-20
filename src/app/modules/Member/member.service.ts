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

const removeUserFromTree = async (memberId: string) => {
  const member = await MemberModel.findById(memberId);

  if (!member) {
    throw new AppError(HttpStatus.NOT_FOUND, "Member not found.");
  }

  if (member.isTreeRoot) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Root member cannot be detached.",
    );
  }

  const hasChildren = await MemberModel.exists({
    parent: member._id,
  });

  if (hasChildren) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Cannot detach a member that has children.",
    );
  }

  await Promise.all([
    MemberModel.findByIdAndUpdate(member._id, {
      parent: null,
      placementStatus: "floating",
    }),

    UserModel.findByIdAndUpdate(member.linkedUser, {
      motherTree: null,
      treeJoinStatus: "unlinked",
    }),

    TreeModel.findByIdAndUpdate(member.tree, {
      $inc: { totalMembers: -1 },
    }),
  ]);

  return {
    success: true,
  };
};

const addUserToTree = async (userId: string, motherMemberId: string) => {
  console.log(userId);
  // 1. Find user
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  // 2. Prevent duplicate placement
  if (user.treeJoinStatus === "placed") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "User is already placed in a tree.",
    );
  }

  // 3. Find mother member
  const motherMember = await MemberModel.findOne({
    _id: new Types.ObjectId(motherMemberId),
    isDeleted: false,
    placementStatus: "placed",
  });

  if (!motherMember) {
    throw new AppError(HttpStatus.NOT_FOUND, "Mother member not found.");
  }

  // 4. Check existing linked member
  const existingMember = user.linkedMember
    ? await MemberModel.findById(user.linkedMember)
    : null;

  let finalMember;

  if (existingMember) {
    // update existing member (NO SAVE METHOD)
    finalMember = await MemberModel.findByIdAndUpdate(
      existingMember._id,
      {
        $set: {
          tree: motherMember.tree,
          parent: motherMember._id,
          label: user.name,
          level: (motherMember.level || 0) + 1,
          relationType: "blood",
          placementStatus: "placed",
          isDeleted: false,
        },
      },
      { new: true },
    );
  } else {
    // create new member
    finalMember = await MemberModel.create({
      tree: motherMember.tree,
      parent: motherMember._id,
      linkedUser: user._id,
      label: user.name,
      level: (motherMember.level || 0) + 1,
      relationType: "blood",
      placementStatus: "placed",
      isTreeRoot: false,
    });
  }

  if (!finalMember) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create or update member.",
    );
  }

  // 5. Update user
  await UserModel.findByIdAndUpdate(user._id, {
    linkedMember: finalMember._id,
    motherTree: motherMember.tree,
    treeJoinStatus: "placed",
  });

  // 6. Update tree count
  await TreeModel.findByIdAndUpdate(motherMember.tree, {
    $inc: { totalMembers: 1 },
  });

  return finalMember;
};

export const memberServices = {
  requestToJoinMotherTree,
  removeUserFromTree,
  addUserToTree,
};
