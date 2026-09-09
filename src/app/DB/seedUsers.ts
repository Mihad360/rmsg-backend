import { UserModel } from "../modules/User/user.model";

export const REAL_USER_DATA = [
  {
    name: "Mohammad Alsubeaei",
    arabicName: "محمد السبيعي",
    email: "mohammad@gmail.com",
    gender: "male",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Nasser Alsubeaei",
    arabicName: "ناصر السبيعي",
    email: "naser@alsubeaei.com.sa",
    gender: "male",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Huda Alsubeaei",
    arabicName: "هدى السبيعي",
    email: "huda.alsubeaei@gmail.com",
    gender: "female",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Ibrahim Alsubeaei",
    arabicName: "إبراهيم السبيعي",
    email: "ibrahim@masic.com.sa",
    gender: "male",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Abdulaziz Alsubeaei",
    arabicName: "عبدالعزيز السبيعي",
    email: "aziz@masic.com.sa",
    gender: "male",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Haifa Alsubeaei",
    email: "haifa.m.s@hotmail.com",
    gender: "female",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Nahla Alsubeaei",
    email: "mrs.nahla96@hotmail.com",
    gender: "female",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Maha Alsubeaei",
    email: "mmm.m.s@hotmail.com",
    gender: "female",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Wafa Alsubeaei",
    email: "wafa.m.s@hotmail.com",
    gender: "female",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
  {
    name: "Nada Alsubeaei",
    email: "nada@mxb.sa",
    gender: "female",
    role: "user",
    password: "123456",
    isVerified: true,
    isActive: true,
    isDeleted: false,
    treeJoinStatus: "unlinked",
  },
];

export const seedUsers = async () => {
  
  try {
    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of REAL_USER_DATA) {
      const existingUser = await UserModel.findOne({
        email: userData.email.toLowerCase(),
      });

      if (!existingUser) {
        await UserModel.create({
          ...userData,
          email: userData.email.toLowerCase(),
        });
        createdCount++;
      } else {
        // Update name, arabicName, and verification status if user already exists
        await UserModel.findByIdAndUpdate(existingUser._id, {
          name: userData.name,
          arabicName: userData.arabicName || existingUser.arabicName,
          isVerified: true,
          isActive: true,
          isDeleted: false,
        });
        skippedCount++;
      }
    }

    console.log("✅ User seeding completed successfully.");
    console.log(`Created Users: ${createdCount}`);
    console.log(`Updated/Skipped Existing Users: ${skippedCount}`);
  } catch (error) {
    console.error("❌ Error seeding real users:", error);
    throw error;
  }
};
