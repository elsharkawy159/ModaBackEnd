import mongoose, { Schema, Types, model } from "mongoose";

// some string => some-string

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lower: true,
    },
    image: { type: Object, required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

categorySchema.virtual("subcategory", {
  localField: "_id",
  foreignField: "categoryId",
  ref: "Subcategory",
});
const categoryModel =
  mongoose.models.Category || model("Category", categorySchema);
export default categoryModel;
