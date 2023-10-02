import mongoose, { Schema, Types, model } from "mongoose";

// some string => some-string

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      upper: true,
    },
    amount: { type: Number, default: 1, required: true },
    minOrderAmount: { type: Number, default: 50, required: true },
    firstOrder: {type:Boolean, default:false, required:true},
    expire: { type: Date, required: true },
    usedBy: [{ type: Types.ObjectId, ref: "User" }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const couponModel = mongoose.models.Coupon || model("Coupon", couponSchema);
export default couponModel;
