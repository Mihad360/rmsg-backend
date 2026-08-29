import { BannerImageModel } from "../modules/Banner/banner.model";

export const startBannerActivationCron = async () => {
  try {
    const now = new Date();

    // banner that SHOULD be active now
    const bannerToActivate = await BannerImageModel.findOne({
      isDeleted: false,
      activateAt: { $lte: now },
    }).sort({ activateAt: -1 });

    // deactivate every banner
    await BannerImageModel.updateMany(
      {
        isDeleted: false,
      },
      {
        isActive: false,
      },
    );

    // activate only one
    if (bannerToActivate) {
      await BannerImageModel.findByIdAndUpdate(bannerToActivate._id, {
        isActive: true,
      });
    }
  } catch (error) {
    console.error("Banner activation cron failed:", error);
  }
};
