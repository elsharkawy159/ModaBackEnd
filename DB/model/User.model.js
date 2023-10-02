import mongoose, { Schema, Types, model } from "mongoose";
const userSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    userName: {
      type: String,
      required: [true, "userName is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 2 char"],
      unique: [true, "userName must be unique value"],
      lower: true,
      trim: true,
    },
    email: {
      type: String,
      unique: [true, "email must be unique value"],
      required: [true, "userName is required"],
      lower: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    phone: {
      type: [String],
      required: [true, "phone is required"],
    },
    address: String,
    gender: {
      type: String,
      default: "male",
      enum: ["male", "female"],
      required: [true, "gender is required"],
    },
    role: {
      type: String,
      default: "User",
      enum: ["User", "Admin", "Vendor", "Employee"],
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "offline",
      enum: ["offline", "online", "blocked"],
    },
    profile: Object,
    DOB: Date,
    code: {
      type: Number,
      default: null,
    },
    changePasswordTime: Date,
    credit: { type: Number, default: 0 },
    wishlist: [{ type: Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.models.User || model("User", userSchema);
export default userModel;
