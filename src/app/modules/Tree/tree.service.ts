/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { MemberModel } from "../Member/member.model";
import { Types } from "mongoose";
import QueryBuilder from "../../../builder/QueryBuilder";
import { IMember } from "../Member/member.interface";
import { TreeModel } from "./tree.model";
import { JwtPayload } from "../../interface/global";

const getMyTree = async (user: JwtPayload, query: Record<string, unknown>) => {
  const existingUser = await UserModel.findById(user.user)
    .select("linkedMember treeJoinStatus")
    .lean();

  if (!existingUser?.linkedMember) {
    throw new AppError(HttpStatus.NOT_FOUND, "User has no linked member node.");
  }
  if (existingUser.treeJoinStatus !== "placed") {
    throw new AppError(HttpStatus.FORBIDDEN, "User is not placed in any tree.");
  }

  const myMember = await MemberModel.findById(existingUser.linkedMember)
    .select("_id parent")
    .lean();

  if (!myMember) {
    throw new AppError(HttpStatus.NOT_FOUND, "Member node not found.");
  }

  // Check if this user has any children
  const hasChildren = await MemberModel.exists({
    parent: myMember._id,
    isDeleted: false,
    placementStatus: "placed",
  });

  if (hasChildren) {
    // I have children → show MY subtree starting from me
    return getTree(myMember._id.toString(), query);
  } else {
    // I have no children → start from my parent so I appear as a child under him
    if (!myMember.parent) {
      // I am the root, no parent
      return getTree(myMember._id.toString(), query);
    }
    return getTree(myMember.parent.toString(), query);
  }
};

const getTree = async (memberId: string, query: Record<string, unknown>) => {
  const startingNode = await MemberModel.findOne({
    _id: new Types.ObjectId(memberId),
    isDeleted: false,
    placementStatus: "placed",
  })
    .select("_id label level relationType parent linkedUser")
    .populate("linkedUser", "_id name profileImage")
    .lean();

  if (!startingNode) {
    throw new AppError(HttpStatus.NOT_FOUND, "Member not found.");
  }

  const buildTree = async (parentId: Types.ObjectId): Promise<any> => {
    const baseQuery = MemberModel.find<IMember>({
      parent: parentId,
      isDeleted: false,
      placementStatus: "placed",
    })
      .select("_id label level relationType parent linkedUser")
      .populate("linkedUser", "_id name profileImage")
      .sort({ createdAt: 1 }); // ← oldest child first

    const children = await new QueryBuilder<IMember>(baseQuery, query)
      .search(["label"])
      .filter()
      .fields()
      .modelQuery.lean();

    return Promise.all(
      children.map(async (child) => ({
        ...child,
        children: await buildTree(child._id as Types.ObjectId),
      })),
    );
  };

  return {
    viewRoot: {
      ...startingNode,
      children: await buildTree(startingNode._id as Types.ObjectId),
    },
    parentMemberId: startingNode.parent ?? null,
  };
};

const getFullTree = async () => {
  const tree = await TreeModel.findOne({ isDeleted: false, isDefault: true })
    .select("_id name totalMembers isDefault rootMember createdBy")
    .populate("createdBy", "_id name email role profileImage")
    .lean();

  if (!tree) {
    throw new AppError(HttpStatus.NOT_FOUND, "Tree not found");
  }

  const allMembers = await MemberModel.find({
    tree: tree._id,
    isDeleted: false,
  })
    .select("_id label level relationType parent spouseOf linkedUser")
    .populate("linkedUser", "_id name email role profileImage")
    .sort({ createdAt: 1 })
    .lean();

  type MemberNode = (typeof allMembers)[number] & {
    children: MemberNode[];
    spouse: MemberNode | null;
  };

  const map = new Map<string, MemberNode>();
  for (const m of allMembers) {
    map.set(m._id.toString(), { ...m, children: [], spouse: null });
  }

  let root: MemberNode | null = null;

  for (const node of map.values()) {
    if (node._id.toString() === tree.rootMember?.toString()) {
      root = node;
      continue;
    }
    if (node.parent) {
      const parentNode = map.get(node.parent.toString());
      if (parentNode) {
        parentNode.children.push(node);
      }
    }
  }

  return {
    treeInfo: {
      _id: tree._id,
      name: tree.name,
      totalMembers: tree.totalMembers,
      isDefault: tree.isDefault,
      createdBy: tree.createdBy,
    },
    root,
  };
};

export const treeServices = {
  getMyTree,
  getTree,
  getFullTree,
};
