import bcrypt from "bcrypt";
import { UserModel } from "../modules/User/user.model";
import { MemberModel } from "../modules/Member/member.model";
import { TreeModel } from "../modules/Tree/tree.model";

// ─────────────────────────────────────────────
// Seed payload — update emails when client provides real ones
// ─────────────────────────────────────────────
const FAMILY_DATA = [
  // root
  {
    name: "Mohammad",
    email: "mohammad@gmail.com",
    isRoot: true,
  },
  // children (level 1) — top group in screenshot
  { name: "Lulouah", email: "lulouah@gmail.com" },
  { name: "Ibrahim", email: "ibrahim@gmail.com" },
  { name: "Huda", email: "huda@gmail.com" },
  { name: "Nassir", email: "nassir@gmail.com" },
  { name: "Haifa", email: "haifa@gmail.com" },
  // children (level 1) — bottom group in screenshot
  { name: "Wafa", email: "wafa@gmail.com" },
  { name: "Maha", email: "maha@gmail.com" },
  { name: "Nada", email: "nada@gmail.com" },
  { name: "Abdulaziz", email: "abdulaziz@gmail.com" },
  { name: "Nahla", email: "nahla@gmail.com" },
];

const DEFAULT_PASSWORD = "123456";

export const seedTree = async () => {
  try {
    // ── Guard: skip if already seeded
    const existingTree = await TreeModel.findOne({ isDefault: true });
    if (existingTree) {
      console.log("Default tree already seeded, skipping.");
      return;
    }

    // ── 1. Create the Tree (no rootMember yet)
    const tree = await TreeModel.create({
      name: "Mohammad",
      totalMembers: 0,
      isDefault: true,
      isDeleted: false,
    });

    // ── 2. Create Mohammad's Member node (root)
    const rootData = FAMILY_DATA.find((f) => f.isRoot)!;

    const rootMember = await MemberModel.create({
      tree: tree._id,
      parent: null,
      label: rootData.name,
      level: 0,
      relationType: "blood",
      placementStatus: "placed",
      isTreeRoot: true,
      isDeleted: false,
    });

    // ── 3. Create Mohammad's User and link to his Member
    const rootUser = await UserModel.create({
      name: rootData.name,
      email: rootData.email,
      password: DEFAULT_PASSWORD,
      role: "user", // Super Admin will promote to admin manually
      isVerified: true,
      isActive: true,
      isDeleted: false,
      motherTree: tree._id,
      linkedMember: rootMember._id,
      treeJoinStatus: "placed",
    });

    // ── 4. Back-link Member → User
    await MemberModel.findByIdAndUpdate(rootMember._id, {
      linkedUser: rootUser._id,
    });

    // ── 5. Create child Members + Users
    const children = FAMILY_DATA.filter((f) => !f.isRoot);

    let childCount = 0;

    for (const child of children) {
      // 5a. Member node
      const member = await MemberModel.create({
        tree: tree._id,
        parent: rootMember._id,
        label: child.name,
        level: 1,
        relationType: "blood",
        placementStatus: "placed",
        isTreeRoot: false,
        isDeleted: false,
      });

      // 5b. User account
      const user = await UserModel.create({
        name: child.name,
        email: child.email,
        password: DEFAULT_PASSWORD,
        role: "user",
        isVerified: true,
        isActive: true,
        isDeleted: false,
        motherTree: tree._id,
        linkedMember: member._id,
        treeJoinStatus: "placed",
      });

      // 5c. Back-link Member → User
      await MemberModel.findByIdAndUpdate(member._id, {
        linkedUser: user._id,
      });

      childCount++;
    }

    // ── 6. Finalise Tree record
    await TreeModel.findByIdAndUpdate(tree._id, {
      rootMember: rootMember._id,
      totalMembers: 1 + childCount,
    });

    console.log("✅ Default tree seeded successfully.");
    console.log(`   Root : ${rootData.name} (${rootData.email})`);
    console.log(`   Children seeded : ${childCount}`);
    console.log(`   Total members   : ${1 + childCount}`);
  } catch (error) {
    console.error("❌ Error seeding default tree:", error);
    throw error;
  }
};
