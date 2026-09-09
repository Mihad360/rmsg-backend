import mongoose from "mongoose";
import config from "../app/config";
import { seedUsers } from "../app/DB/seedUsers";

const run = async () => {
  try {
    console.log("🌱 Connecting to database...");
    await mongoose.connect(config.DATABASE_URL as string, {
      dbName: "Rmsg",
    });
    console.log("Connected to MongoDB.");

    await seedUsers();

    console.log("🎉 User seeding script finished execution.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running user seeding script:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
