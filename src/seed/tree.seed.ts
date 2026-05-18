/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { TreeModel } from "../app/modules/Tree/tree.model";
import { UserModel } from "../app/modules/User/user.model";
import { MemberModel } from "../app/modules/Member/member.model";

const names = [
  "Lulouah",
  "Ibrahim",
  "Huda",
  "Nassir",
  "Haifa",
  "Mohammad",
  "Wafa",
  "Maha",
  "Nada",
  "Abdulaziz",
  "Nahl",
];

export const seedTree = async () => {
  await mongoose.connect(process.env.DB_URL as string);

  console.log("🌱 Seeding started...");

  // 1. Create Tree
  const tree = await TreeModel.create({
    name: "Main Family Tree",
    isDefault: true,
    totalMembers: 0,
  });

  console.log("🌳 Tree created");

  const users: any[] = [];

  // helper: give safe DOB so age always passes (>= 20 years old)
  //   const getDOB = () => {
  //     const date = new Date();
  //     date.setFullYear(date.getFullYear() - 25); // 25 years old
  //     return date;
  //   };

  // 2. Create Users (IMPORTANT: triggers pre-save hooks)
  for (const name of names) {
    const user = await UserModel.create({
      email: `${name.toLowerCase()}@mail.com`,
      password: "123456", // will be auto-hashed by pre-save hook
      name,
      //   dateOfBirth: getDOB(),
      isVerified: true,
      isActive: true,
      treeJoinStatus: "unlinked",
    });

    users.push(user);
  }

  console.log("👤 Users created");

  // 3. Root user (Mohammad)
  const rootUser = users.find((u) => u.name === "Mohammad");
  if (!rootUser) throw new Error("Mohammad not found");

  // 4. Create root member
  const rootMember = await MemberModel.create({
    tree: tree._id,
    parent: null,
    linkedUser: rootUser._id,
    label: rootUser.name,
    level: 0,
    relationType: "blood",
    placementStatus: "placed",
    isTreeRoot: true,
  });

  // 5. Update tree root
  await TreeModel.findByIdAndUpdate(tree._id, {
    rootMember: rootMember._id,
    $inc: { totalMembers: 1 },
  });

  // 6. Link root user
  await UserModel.findByIdAndUpdate(rootUser._id, {
    linkedMember: rootMember._id,
    motherTree: tree._id,
    treeJoinStatus: "placed",
  });

  // 7. Attach children to root
  for (const user of users) {
    if (user.name === "Mohammad") continue;

    const member = await MemberModel.create({
      tree: tree._id,
      parent: rootMember._id,
      linkedUser: user._id,
      label: user.name,
      level: 1,
      relationType: "blood",
      placementStatus: "placed",
      isTreeRoot: false,
    });

    await UserModel.findByIdAndUpdate(user._id, {
      linkedMember: member._id,
      motherTree: tree._id,
      treeJoinStatus: "placed",
    });

    await TreeModel.findByIdAndUpdate(tree._id, {
      $inc: { totalMembers: 1 },
    });
  }

  console.log("✅ Seeding completed successfully");
  process.exit();
};
