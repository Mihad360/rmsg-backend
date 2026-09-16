/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import config from "../config";

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean; message: string }> => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const checkEmail = regex.test(to);
  if (!checkEmail) {
    return {
      success: false,
      message: "Invalid email format.",
    };
  }
  try {
    // const transporter = nodemailer.createTransport({
    //   host: "smtp.gmail.com",
    //   port: 465,
    //   secure: true,
    //   auth: {
    //     user: config.NODE_MAIL_EMAIL,
    //     pass: config.NODE_MAIL_PASS,
    //   },
    // });

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: config.NODE_MAIL_EMAIL,
        pass: config.NODE_MAIL_PASS,
      },
    });

    const plainText = html.replace(/<[^>]*>/g, "").trim();

    const info = await transporter.sendMail({
      from: `"Masic Generation" <${config.NODE_MAIL_EMAIL}>`,
      replyTo: config.NODE_MAIL_EMAIL,
      to,
      subject,
      text: plainText,
      html,
    });

    console.log("Message sent:", info.messageId);
    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    return { success: false, message: error.message || "Email sending failed" };
  }
};
