import { Types } from "mongoose";

export type NotificationType =
  | "user_registration"
  | "user_login"
  | "user_join"
  | "message"
  | "announcement"
  | "poll"
  | "job_request"
  | "request"
  | "request_status";

export interface INotification {
  sender: Types.ObjectId;
  recipient?: Types.ObjectId; // The user ID or admin ID
  type: NotificationType; // Type of notification
  title?: string;
  message: string; // Message content
  isRead?: boolean; // To mark the notification as read or unread
  createdAt?: Date; // Timestamp of when the notification was created
}
