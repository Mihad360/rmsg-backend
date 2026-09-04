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

// escape user input so it is treated as a literal string inside a RegExp
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getMyTree = async (user: JwtPayload) => {
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
    .select("_id parent tree")
    .lean();

  if (!myMember) {
    throw new AppError(HttpStatus.NOT_FOUND, "Member node not found.");
  }

  const hasChildren = await MemberModel.exists({
    parent: myMember._id,
    isDeleted: false,
    placementStatus: "placed",
  });

  const startingMemberId = hasChildren
    ? myMember._id.toString()
    : myMember.parent
      ? myMember.parent.toString()
      : myMember._id.toString();

  // fetch tree info
  const tree = await TreeModel.findOne({ isDeleted: false, isDefault: true })
    .select("_id name totalMembers isDefault rootMember createdBy")
    .populate("createdBy", "_id name email role profileImage")
    .lean();

  if (!tree) {
    throw new AppError(HttpStatus.NOT_FOUND, "Tree not found.");
  }

  // fetch all members under this tree
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

  // build map
  const map = new Map<string, MemberNode>();
  for (const m of allMembers) {
    map.set(m._id.toString(), { ...m, children: [], spouse: null });
  }

  // build tree from startingMemberId instead of rootMember
  let root: MemberNode | null = null;

  for (const node of map.values()) {
    if (node._id.toString() === startingMemberId) {
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

const getTree = async (memberId: string, query: Record<string, unknown>) => {
  const startingNode = await MemberModel.findOne({
    _id: new Types.ObjectId(memberId),
    isDeleted: false,
    placementStatus: "placed",
  })
    .select("_id label level relationType parent linkedUser")
    .populate("linkedUser")
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
      .populate("linkedUser")
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

const getFullTree = async (query: Record<string, unknown> = {}) => {
  const tree = await TreeModel.findOne({ isDeleted: false, isDefault: true })
    .select("_id name totalMembers isDefault rootMember createdBy")
    .populate("createdBy", "_id name arabicName email role profileImage")
    .lean();

  if (!tree) {
    throw new AppError(HttpStatus.NOT_FOUND, "Tree not found");
  }

  const allMembers = await MemberModel.find({
    tree: tree._id,
    isDeleted: false,
    placementStatus: "placed",
  })
    .select("_id label level relationType parent spouseOf linkedUser")
    .populate("linkedUser", "_id name arabicName email role profileImage")
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

  // Search: promote members whose label matches directly under the main
  // root, each keeping its own subtree, and drop everything else.
  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : "";

  if (searchTerm && root) {
    const regex = new RegExp(escapeRegex(searchTerm), "i");

    const rootId = root._id.toString();

    // nodes whose label matches the search term
    const matched = new Set<string>();
    for (const node of map.values()) {
      if (node.label && regex.test(node.label)) {
        matched.add(node._id.toString());
      }
    }

    // a match is "top-most" when none of its ancestors also matched, so we
    // never show the same person twice (once on top and once nested).
    const isDescendantOfMatch = (node: MemberNode): boolean => {
      let current = node.parent ? map.get(node.parent.toString()) : undefined;
      while (current) {
        if (matched.has(current._id.toString())) return true;
        current = current.parent
          ? map.get(current.parent.toString())
          : undefined;
      }
      return false;
    };

    const topMatches: MemberNode[] = [];
    for (const id of matched) {
      const node = map.get(id);
      if (node && !isDescendantOfMatch(node)) {
        topMatches.push(node);
      }
    }

    // keep root order stable (oldest first, like the full tree)
    topMatches.sort((a, b) => a.label?.localeCompare(b.label ?? "") ?? 0);

    // if the root itself matched, just return the whole tree from the root
    if (matched.has(rootId)) {
      // root already carries its full subtree, nothing to change
    } else {
      // promote the matched members directly under the main root, each
      // keeping its own full subtree of children
      root = { ...root, children: topMatches };
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
