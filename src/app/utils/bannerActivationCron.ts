import { BannerImageModel } from "../modules/Banner/banner.model";

export const startBannerActivationCron = async () => {
  try {
    console.log("🕒 Running banner cron job...");

    const now = new Date();

    // find current active banner
    const activeBanner = await BannerImageModel.findOne({
      isActive: true,
      isDeleted: false,
    });
    if (activeBanner) {
      console.log("✅ Active banner found:", activeBanner._id);
      if (!activeBanner.activateAt) {
        console.log("⚠️ Active banner has no activateAt date.");
        return;
      }
      const expireDate = new Date(activeBanner.activateAt);
      expireDate.setMonth(expireDate.getMonth() + 2);

      console.log("📅 Active banner expires at:", expireDate.toISOString());

      // deactivate expired banner
      if (now >= expireDate) {
        console.log("❌ Active banner expired. Deactivating...");

        await BannerImageModel.findByIdAndUpdate(activeBanner._id, {
          isActive: false,
        });

        console.log("✅ Previous banner deactivated.");

        // activate next banner
        const nextBanner = await BannerImageModel.findOne({
          isDeleted: false,
          isActive: false,
          activateAt: { $lte: now },
        }).sort({ activateAt: 1 });

        if (nextBanner) {
          console.log("🚀 Activating next banner:", nextBanner._id);

          await BannerImageModel.findByIdAndUpdate(nextBanner._id, {
            isActive: true,
          });

          console.log("✅ Next banner activated.");
        } else {
          console.log("⚠️ No next banner available to activate.");
        }
      } else {
        console.log("🟢 Active banner still valid.");
      }
    } else {
      console.log("⚠️ No active banner found.");

      // activate first available scheduled banner
      const nextBanner = await BannerImageModel.findOne({
        isDeleted: false,
        isActive: false,
        activateAt: { $lte: now },
      }).sort({ activateAt: 1 });

      if (nextBanner) {
        console.log("🚀 Activating banner:", nextBanner._id);

        await BannerImageModel.findByIdAndUpdate(nextBanner._id, {
          isActive: true,
        });

        console.log("✅ Banner activated successfully.");
      } else {
        console.log("⚠️ No banner available for activation.");
      }
    }

    console.log("✅ Banner cron job finished.");
  } catch (error) {
    console.error("❌ Banner cron error:", error);
  }
};
