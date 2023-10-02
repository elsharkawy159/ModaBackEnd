import mongoose, { Schema, Types, model } from "mongoose";

const vendorSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["Company", "Personal"], required: true },
    specialization: { type: String, required: true },
    vendorAddress: { type: String, required: true },
    handMade: { type: Boolean, required: true },
    premium: { type: Boolean, required: true },
    prepareDays: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const vendorModel = mongoose.models.Vendor || model("Vendor", vendorSchema);
export default vendorModel;
