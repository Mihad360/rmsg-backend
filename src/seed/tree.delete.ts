import mongoose from "mongoose";
import config from "../app/config";
import { deleteTree } from "../app/DB/seedTree";

const run = async () => {
  try {
    console.log("🗑️ Connecting to database...");
    await mongoose.connect(config.DATABASE_URL as string, {
      dbName: "Rmsg",
    });
    console.log("Connected to MongoDB.");

    await deleteTree();

    console.log("🎉 Tree deletion process completed successfully.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during tree deletion script execution:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
