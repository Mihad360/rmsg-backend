import mongoose from "mongoose";
import config from "./src/app/config";
import { UserModel } from "./src/app/modules/User/user.model";

async function cleanup() {
  try {
    await mongoose.connect(config.DATABASE_URL as string, {
      dbName: "Rmsg",
    });
    console.log("Database connected successfully");

    const result = await UserModel.updateMany(
      {
        role: { $nin: ["superAdmin"] },
        treeJoinStatus: { $ne: "placed" },
        isDeleted: false,
      },
      {
        $set: { isDeleted: true },
      }
    );

    console.log(`Soft deleted ${result.modifiedCount} users that are not placed in the tree.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

cleanup();
