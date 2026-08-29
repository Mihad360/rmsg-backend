import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { NotificationModel } from "./notification.model";
import { INotification } from "./notification.interface";
import { ClientSession } from "mongoose";

export const createNotification = async (
  payload: INotification,
  session?: ClientSession,
) => {
  if (!payload) {
    throw new AppError(HttpStatus.NOT_FOUND, "Response not found");
  }

  // pass the session so the write joins the caller's transaction
  const [notification] = await NotificationModel.create([payload], { session });

  if (!notification) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Notification creation failed");
  }

  return notification;
};
