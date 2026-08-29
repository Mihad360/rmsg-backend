import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserInterface } from "./user.interface";

// const profileImageSchema = new Schema(
//   {
//     path: {
//       type: String,
//     },
//     url: {
//       type: String,
//     },
//   },
//   { _id: false },
// );

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    arabicName: {
      type: String,
      match: /^[\u0600-\u06FF\s]+$/,
    },
    profileImage: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin", "superAdmin"],
      default: "user",
    },

    // profile
    phone: {
      type: String,
    },

    // 🌍 location
    address: { type: String },
    country: { type: String, default: "Saudi Arabia" },
    countryCode: { type: String, default: "SA" },
    region: { type: String, default: null },
    city: { type: String, default: null },
    district: { type: String, default: null },

    // ===== NEW REQUEST-BASED FIELDS =====
    bio: {
      type: String,
      default: null,
    },

    contact: {
      phone: { type: String },
      email: { type: String },
      linkedin: { type: String },
      address: { type: String },
    },

    educationHistory: [
      {
        school: String,
        degree: String,
        major: String,
        from: Date,
        to: Date,
        isCurrent: Boolean,
      },
    ],

    experience: [
      {
        company: String,
        position: String,
        from: Date,
        to: Date,
        isCurrent: Boolean,
      },
    ],

    cvUrl: {
      type: String,
      default: null,
    },

    certificateUrl: {
      type: String,
      default: null,
    },
    // ====================================

    dateOfBirth: {
      type: Date,
      default: null,
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: null,
    },
    employmentStatus: {
      type: String,
      default: null,
    },
    education: {
      type: String,
      default: null,
    },
    educationLevel: {
      type: String,
      default: null,
    },
    universityName: {
      type: String,
      default: null,
    },
    fieldOfWork: {
      type: String,
      default: null,
    },
    spouseName: {
      type: String,
      default: null,
    },
    spousePhone: {
      type: String,
      default: null,
    },
    linkedinLink: {
      type: String,
      default: null,
    },

    // tree
    motherTree: {
      type: Schema.Types.ObjectId,
      ref: "Tree",
      default: null,
    },
    linkedMember: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    treeJoinStatus: {
      type: String,
      enum: ["pending_placement", "placed", "unlinked"],
      default: "unlinked",
    },

    // admin
    adminScope: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    adminGrantedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // system
    fcmToken: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre("save", function (next) {
  if (this.dateOfBirth) {
    const today = new Date();
    const dob = new Date(this.dateOfBirth);

    let age = today.getFullYear() - dob.getFullYear();

    const monthDiff = today.getMonth() - dob.getMonth();

    // adjust if birthday hasn't happened yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    this.age = age;

    // ✅ Example validation
    if (age < 13) {
      return next(new Error("User must be at least 13 years old"));
    }
  }

  next();
});

userSchema.statics.isUserExistByEmail = async function (email: string) {
  return this.findOne({ email, isDeleted: false }).select("+password");
};

userSchema.statics.isUserExistByCustomId = async function (email: string) {
  return this.findOne({ email });
};

userSchema.statics.compareUserPassword = async function (
  payloadPassword: string,
  hashedPassword: string,
) {
  return bcrypt.compare(payloadPassword, hashedPassword);
};

userSchema.statics.newHashedPassword = async function (newPassword: string) {
  return bcrypt.hash(newPassword, 10);
};

userSchema.statics.isOldTokenValid = async function (
  passwordChangedTime: Date,
  jwtIssuedTime: number,
) {
  const passwordChangedTimestamp = passwordChangedTime?.getTime() / 1000;

  return passwordChangedTimestamp < jwtIssuedTime;
};

userSchema.statics.isJwtIssuedBeforePasswordChange = function (
  passwordChangeTimeStamp: Date,
  jwtIssuedTimeStamp: number,
) {
  if (!passwordChangeTimeStamp) return false;

  const passwordChangedTime =
    new Date(passwordChangeTimeStamp).getTime() / 1000;

  return passwordChangedTime > jwtIssuedTimeStamp;
};

export const UserModel = model<IUser, UserInterface>("User", userSchema);
