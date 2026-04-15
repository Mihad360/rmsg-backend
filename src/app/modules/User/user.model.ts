import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserInterface } from "./user.interface";

const profileImageSchema = new Schema(
  {
    path: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  { _id: false },
);

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
    profileImage: {
      type: String,
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
    // 🌍 location (Saudi structure)
    address: {
      type: String,
    },
    country: {
      type: String,
      default: "Saudi Arabia",
    },
    countryCode: {
      type: String,
      default: "SA",
    },
    region: {
      type: String, // e.g. Riyadh Province
    },
    city: {
      type: String, // e.g. Riyadh, Jeddah
    },
    district: {
      type: String, // e.g. Al Olaya
    },

    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
    },
    employmentStatus: {
      type: String,
    },
    education: {
      type: String,
    },
    educationLevel: {
      type: String,
    },
    universityName: {
      type: String,
    },
    fieldOfWork: {
      type: String,
    },
    spouseName: {
      type: String,
    },
    spousePhone: {
      type: String,
    },
    linkedinLink: {
      type: String,
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

    // admin — only populated when role is "admin"
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
