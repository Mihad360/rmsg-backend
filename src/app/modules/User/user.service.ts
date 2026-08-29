/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "./user.model";
import AppError from "../../erros/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { IUser } from "./user.interface";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";

const searchUsers = ["name", "phone", "address"];

const getMe = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId).select(
    "-password -fcmToken -otp -passwordChangedAt -expiresAt",
  );
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  return isUserExist;
};

const getUsers = async (query: Record<string, unknown>) => {
  const modifiedQuery = { ...query };

  if (modifiedQuery.fieldOfWork) {
    modifiedQuery.fieldOfWork = {
      $regex: modifiedQuery.fieldOfWork,
      $options: "i",
    };
  }

  const userQuery = new QueryBuilder(
    UserModel.find(
      {},
      "-fcmToken -password -otp -expiresAt -isVerified -passwordChangedAt",
    ),
    modifiedQuery,
  )
    .search(searchUsers)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;
  return { meta, result };
};

const getEachUser = async (id: string) => {
  const user = await UserModel.findById(id).select(
    "-fcmToken -password -otp -expiresAt -isVerified -passwordChangedAt",
  );
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "user not found");
  }
  return user;
};

const editProfile = async (
  id: string,
  payload: Partial<IUser>,
  files?: {
    image?: Express.Multer.File[];
    cv?: Express.Multer.File[];
    certificates?: Express.Multer.File[];
  },
) => {
  const user = await UserModel.findById(id);

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This user is deleted");
  }

  const updateData: Record<string, any> = {};

  // =========================
  // FLAT SAFE FIELDS (direct set)
  // =========================
  const directFields: (keyof IUser)[] = [
    "name",
    "phone",
    "bio",
    "address",
    "country",
    "countryCode",
    "region",
    "city",
    "district",
    "dateOfBirth",
    "gender",
    "employmentStatus",
    "education",
    "educationLevel",
    "universityName",
    "fieldOfWork",
    "spouseName",
    "spousePhone",
    "linkedinLink",
  ];

  directFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  });

  // =========================
  // NESTED SAFE MERGE (IMPORTANT)
  // =========================
  if (payload.contact) {
    updateData.contact = {
      ...(user.contact || {}),
      ...payload.contact,
    };
  }

  if (payload.educationHistory) {
    updateData.educationHistory = payload.educationHistory;
  }

  if (payload.experience) {
    updateData.experience = payload.experience;
  }

  // =========================
  // FILES
  // =========================
  // profile image
  if (files?.image?.[0]) {
    const upload = await sendFileToCloudinary(
      files.image[0].buffer,
      files.image[0].originalname,
      files.image[0].mimetype,
    );
    updateData.profileImage = upload.secure_url;
  }

  // CV
  if (files?.cv?.[0]) {
    const upload = await sendFileToCloudinary(
      files.cv[0].buffer,
      files.cv[0].originalname,
      files.cv[0].mimetype,
    );
    updateData.cvUrl = upload.secure_url;
  }

  // certificates (replace full array for now)
  if (files?.certificates?.length) {
    const uploadedCertificates = await Promise.all(
      files.certificates.map(async (file) => {
        const upload = await sendFileToCloudinary(
          file.buffer,
          file.originalname,
          file.mimetype,
        );
        return upload.secure_url;
      }),
    );

    updateData.certificateUrls = uploadedCertificates;
  }

  // =========================
  // DOB + AGE LOGIC
  // =========================
  if (payload.dateOfBirth) {
    const dob = new Date(payload.dateOfBirth);

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();

    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 13) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "User must be at least 13 years old",
      );
    }

    updateData.dateOfBirth = dob;
    updateData.age = age;
  }

  // =========================
  // UPDATE
  // =========================
  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  ).select("-password -otp -expiresAt");

  return updatedUser;
};

const deleteUser = async (id: string) => {
  const user = await UserModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "user not deleted");
  }
  return user;
};

export const userServices = {
  getMe,
  getUsers,
  editProfile,
  getEachUser,
  deleteUser,
};
