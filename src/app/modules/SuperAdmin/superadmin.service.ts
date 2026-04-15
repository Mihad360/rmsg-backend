import HttpStatus from "http-status";
import { RequestStatus } from "../Request/request.interface";
import { RequestModel } from "../Request/request.model";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";

const updateRequestStatus = async (
  requestId: string,
  payload: {
    status: RequestStatus;
    declineReason?: string;
    additionalInfoRequest?: string;
  },
) => {
  const request = await RequestModel.findById(requestId).lean();
  if (!request) {
    throw new AppError(HttpStatus.NOT_FOUND, "Request not found.");
  }

  if (payload.status === "declined" && !payload.declineReason) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Decline reason is required when declining a request.",
    );
  }

  if (
    payload.status === "additional_info_required" &&
    !payload.additionalInfoRequest
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Additional info message is required.",
    );
  }

  const updated = await RequestModel.findByIdAndUpdate(
    requestId,
    {
      status: payload.status,
      ...(payload.declineReason && { declineReason: payload.declineReason }),
      ...(payload.additionalInfoRequest && {
        additionalInfoRequest: payload.additionalInfoRequest,
      }),
    },
    { new: true },
  ).lean();

  return updated;
};

const allowedRoles = ["admin", "user"];

const updateRoleAccess = async (userId: string, payload: { role: string }) => {
  if (!allowedRoles.includes(payload.role)) {
    throw new Error("Invalid role");
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { role: payload.role },
    { new: true },
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

const getDashboardStats = async (query: Record<string, unknown>) => {
  const roleFilter = { role: { $in: ["user", "admin"] } };

  // build reusable base match
  const baseMatch: Record<string, unknown> = {
    isDeleted: false,
    ...roleFilter,
  };

  // apply filters from query
  if (query.gender) {
    baseMatch.gender = query.gender;
  }

  if (query.minAge || query.maxAge) {
    const ageFilter: { $gte?: number; $lte?: number } = {};
    if (query.minAge) ageFilter.$gte = Number(query.minAge);
    if (query.maxAge) ageFilter.$lte = Number(query.maxAge);
    baseMatch.age = ageFilter;
  }

  if (query.employmentStatus) {
    baseMatch.employmentStatus = query.employmentStatus;
  }

  if (query.educationLevel) {
    baseMatch.educationLevel = query.educationLevel;
  }

  // 1. AGE RANGE
  const ageRangeRaw = await UserModel.aggregate([
    {
      $match: {
        ...baseMatch,
        age: {
          ...(baseMatch.age ? (baseMatch.age as object) : {}),
          $exists: true,
          $ne: null,
        },
      },
    },
    {
      $bucket: {
        groupBy: "$age",
        boundaries: [10, 21, 41, 61, 81, 101],
        default: "Other",
        output: { count: { $sum: 1 } },
      },
    },
    {
      $project: {
        _id: 0,
        range: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", 10] }, then: "10-20" },
              { case: { $eq: ["$_id", 21] }, then: "21-40" },
              { case: { $eq: ["$_id", 41] }, then: "41-60" },
              { case: { $eq: ["$_id", 61] }, then: "61-80" },
              { case: { $eq: ["$_id", 81] }, then: "81-100" },
            ],
            default: "Other",
          },
        },
        count: 1,
      },
    },
  ]);

  // ✅ calculate percentage
  const totalAge = ageRangeRaw.reduce((acc, a) => acc + a.count, 0);

  const ageRange = ageRangeRaw.map((a) => ({
    ...a,
    percentage: totalAge > 0 ? Math.round((a.count / totalAge) * 100) : 0,
  }));

  // 2. GENDER
  const genderStats = await UserModel.aggregate([
    {
      $match: {
        ...baseMatch,
        gender: { $exists: true, $ne: null },
      },
    },
    { $group: { _id: "$gender", count: { $sum: 1 } } },
    { $project: { _id: 0, gender: "$_id", count: 1 } },
  ]);

  const totalGender = genderStats.reduce((acc, g) => acc + g.count, 0);
  const genderWithPercentage = genderStats.map((g) => ({
    ...g,
    percentage: totalGender > 0 ? Math.round((g.count / totalGender) * 100) : 0,
  }));

  // 3. COMMON NAMES
  const commonNames = await UserModel.aggregate([
    {
      $match: {
        ...baseMatch,
        name: { $exists: true, $ne: null },
      },
    },
    { $group: { _id: "$name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, name: "$_id", count: 1 } },
  ]);

  const totalNames = commonNames.reduce((acc, n) => acc + n.count, 0);
  const namesWithPercentage = commonNames.map((n) => ({
    ...n,
    percentage: totalNames > 0 ? Math.round((n.count / totalNames) * 100) : 0,
  }));

  // 4. EMPLOYMENT STATUS
  const employmentStats = await UserModel.aggregate([
    {
      $match: {
        ...baseMatch,
        employmentStatus: { $exists: true, $ne: null },
      },
    },
    { $group: { _id: "$employmentStatus", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);

  const totalEmployment = employmentStats.reduce((acc, e) => acc + e.count, 0);
  const employmentWithPercentage = employmentStats.map((e) => ({
    ...e,
    percentage:
      totalEmployment > 0 ? Math.round((e.count / totalEmployment) * 100) : 0,
  }));

  // 5. FIELD OF WORK
  const fieldOfWork = await UserModel.aggregate([
    {
      $match: {
        ...baseMatch,
        fieldOfWork: { $exists: true, $ne: null },
      },
    },
    { $group: { _id: "$fieldOfWork", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, field: "$_id", count: 1 } },
  ]);

  const totalFieldOfWork = fieldOfWork.reduce((acc, f) => acc + f.count, 0);
  const fieldOfWorkWithPercentage = fieldOfWork.map((f) => ({
    ...f,
    percentage:
      totalFieldOfWork > 0 ? Math.round((f.count / totalFieldOfWork) * 100) : 0,
  }));

  // 6. SCHOOL OR UNIVERSITY
  const educationStats = await UserModel.aggregate([
    {
      $match: {
        ...baseMatch,
        educationLevel: { $exists: true, $ne: null },
      },
    },
    { $group: { _id: "$educationLevel", count: { $sum: 1 } } },
    { $project: { _id: 0, level: "$_id", count: 1 } },
  ]);

  const totalEducation = educationStats.reduce((acc, e) => acc + e.count, 0);
  const educationWithPercentage = educationStats.map((e) => ({
    ...e,
    percentage:
      totalEducation > 0 ? Math.round((e.count / totalEducation) * 100) : 0,
  }));

  // 7. LOCATION
  const locationStats = await UserModel.aggregate([
    {
      $match: {
        ...baseMatch,
        district: { $exists: true, $ne: null },
      },
    },
    { $group: { _id: "$district", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, location: "$_id", count: 1 } },
  ]);

  const totalLocation = locationStats.reduce((acc, l) => acc + l.count, 0);

  const locationWithPercentage = locationStats.map((l) => ({
    ...l,
    percentage:
      totalLocation > 0 ? Math.round((l.count / totalLocation) * 100) : 0,
  }));

  return {
    ageRange,
    gender: genderWithPercentage,
    commonNames: namesWithPercentage,
    employmentStatus: employmentWithPercentage,
    fieldOfWork: fieldOfWorkWithPercentage,
    educationLevel: educationWithPercentage,
    location: locationWithPercentage,
  };
};

export const superAdminServices = {
  updateRequestStatus,
  updateRoleAccess,
  getDashboardStats,
};
