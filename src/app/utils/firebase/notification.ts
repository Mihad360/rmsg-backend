/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserModel } from "../../modules/User/user.model";
import admin from "./firebase";

export const sendPushNotifications = async (
  tokens: string | string[],
  title: string,
  body: string,
) => {
  if (!tokens) return;

  // 🔥 Normalize to unique valid array
  const rawTokens: string[] = Array.isArray(tokens) ? tokens : [tokens];
  const tokenArray = [
    ...new Set(
      rawTokens.filter(
        (t) => typeof t === "string" && t.trim().length > 0,
      ),
    ),
  ];

  if (tokenArray.length === 0) return;

  try {
    const message = {
      notification: { title, body },
      tokens: tokenArray,
    };
    const response = await admin.messaging().sendEachForMulticast(message);

    const invalidTokens: string[] = [];

    // Auto-remove invalid or expired tokens
    response.responses.forEach((res: any, index: number) => {
      if (!res.success) {
        const errorCode = res.error?.code;

        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokenArray[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      console.log("Removing invalid FCM tokens:", invalidTokens);
      await UserModel.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { $pull: { fcmToken: { $in: invalidTokens } } },
      );
    }

    return response;
  } catch (error) {
    console.error("Failed to send push notifications via Firebase:", error);
    return null;
  }
};
