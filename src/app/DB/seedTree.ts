import { UserModel } from "../modules/User/user.model";
import { MemberModel } from "../modules/Member/member.model";
import { TreeModel } from "../modules/Tree/tree.model";

// ─────────────────────────────────────────────
// Seed payload — only basic user info
// ─────────────────────────────────────────────
const FAMILY_DATA = [
  // ROOT
  {
    name: "Mohammad",
    arabicName: "محمد السبيعي",
    email: "mohammad@gmail.com",
    role: "superAdmin",
    gender: "male",
    isRoot: true,
  },

  // CHILDREN
  {
    name: "Lulouah Alsubeaei",
    arabicName: "لولوة السبيعي",
    email: "lulouah@gmail.com",
    role: "user",
    gender: "female",
  },
  {
    name: "Ibrahim Alsubeaei",
    arabicName: "إبراهيم السبيعي",
    email: "ibrahim@masic.com.sa",
    role: "user",
    gender: "male",
  },
  {
    name: "Huda Alsubeaei",
    arabicName: "هدى السبيعي",
    email: "huda.m.alsubeaei@gmail.com",
    role: "user",
    gender: "female",
  },
  {
    name: "Nasser Alsubeaei",
    arabicName: "ناصر السبيعي",
    email: "naser@alsubeaei.com.sa",
    role: "user",
    gender: "male",
  },
  {
    name: "Haifa Alsubeaei",
    arabicName: "هيفاء السبيعي",
    email: "haifa.m.s@hotmail.com",
    role: "user",
    gender: "female",
  },
  {
    name: "Wafa Alsubeaei",
    arabicName: "وفاء السبيعي",
    email: "wafa.m.s@hotmail.com",
    role: "user",
    gender: "female",
  },
  {
    name: "Maha Alsubeaei",
    arabicName: "مها السبيعي",
    email: "mmm.m.s@hotmail.com",
    role: "user",
    gender: "female",
  },
  {
    name: "Nada Alsubeaei",
    arabicName: "ندى السبيعي",
    email: "nada@mxb.sa",
    role: "user",
    gender: "female",
  },
  {
    name: "Abdulaziz Alsubeaei",
    arabicName: "عبدالعزيز السبيعي",
    email: "aziz@masic.com.sa",
    role: "user",
    gender: "male",
  },
  {
    name: "Nahla Alsubeaei",
    arabicName: "نهلة السبيعي",
    email: "mrs.nahla96@hotmail.com",
    role: "user",
    gender: "female",
  },
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

    // ── 1. Create Tree
    const tree = await TreeModel.create({
      name: "Mohammad",
      totalMembers: 0,
      isDefault: true,
      isDeleted: false,
    });

    // ── 2. Root data
    const rootData = FAMILY_DATA.find((f) => f.isRoot);
    if (!rootData) throw new Error("Root user not found in FAMILY_DATA");

    // ── 3. Create root member
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

    // ── 4. Find or Create root user
    let rootUser = await UserModel.findOne({
      email: rootData.email.toLowerCase(),
    });

    if (!rootUser) {
      rootUser = await UserModel.create({
        name: rootData.name,
        arabicName: rootData.arabicName,
        email: rootData.email.toLowerCase(),
        password: DEFAULT_PASSWORD,
        role: rootData.role || "user",
        gender: rootData.gender,

        isVerified: true,
        isActive: true,
        isDeleted: false,

        motherTree: tree._id,
        linkedMember: rootMember._id,
        treeJoinStatus: "placed",
      });
    } else {
      await UserModel.findByIdAndUpdate(rootUser._id, {
        motherTree: tree._id,
        linkedMember: rootMember._id,
        treeJoinStatus: "placed",
      });
    }

    await MemberModel.findByIdAndUpdate(rootMember._id, {
      linkedUser: rootUser._id,
    });

    // ── 5. Children
    const children = FAMILY_DATA.filter((f) => !f.isRoot);

    let childCount = 0;

    for (const child of children) {
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

      let user = await UserModel.findOne({ email: child.email.toLowerCase() });

      if (!user) {
        user = await UserModel.create({
          name: child.name,
          arabicName: child.arabicName,
          email: child.email.toLowerCase(),
          password: DEFAULT_PASSWORD,
          role: child.role || "user",
          gender: child.gender,

          isVerified: true,
          isActive: true,
          isDeleted: false,

          motherTree: tree._id,
          linkedMember: member._id,
          treeJoinStatus: "placed",
        });
      } else {
        await UserModel.findByIdAndUpdate(user._id, {
          motherTree: tree._id,
          linkedMember: member._id,
          treeJoinStatus: "placed",
        });
      }

      await MemberModel.findByIdAndUpdate(member._id, {
        linkedUser: user._id,
      });

      childCount++;
    }

    // ── 6. Final tree update
    await TreeModel.findByIdAndUpdate(tree._id, {
      rootMember: rootMember._id,
      totalMembers: childCount + 1,
    });

    console.log("✅ Default tree seeded successfully");
    console.log(`Root: ${rootData.name}`);
    console.log(`Children: ${childCount}`);
  } catch (error) {
    console.error("❌ Error seeding default tree:", error);
    throw error;
  }
};

export const deleteTree = async () => {
  try {
    // ── 1. Delete all tree records
    const treeResult = await TreeModel.deleteMany({});

    // ── 2. Delete all member records
    const memberResult = await MemberModel.deleteMany({});

    // ── 3. Delete family users created by seeding or linked to trees
    const familyEmails = FAMILY_DATA.map((f) => f.email);
    const userResult = await UserModel.deleteMany({
      $or: [
        { email: { $in: familyEmails } },
        { motherTree: { $ne: null } },
        { linkedMember: { $ne: null } },
      ],
    });

    // ── 4. Unlink tree properties from any remaining users
    await UserModel.updateMany(
      {},
      {
        $set: {
          motherTree: null,
          linkedMember: null,
          treeJoinStatus: "unlinked",
        },
      }
    );

    console.log("✅ Tree data deleted successfully from database.");
    console.log(`Deleted Trees: ${treeResult.deletedCount}`);
    console.log(`Deleted Members: ${memberResult.deletedCount}`);
    console.log(`Deleted Family Users: ${userResult.deletedCount}`);
  } catch (error) {
    console.error("❌ Error deleting tree from database:", error);
    throw error;
  }
};
