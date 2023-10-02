import userModel from "../../../../DB/model/User.model.js";
import vendorModel from "../../../../DB/model/Vendor.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { paginate } from "../../../utils/paginate.js";

export const getVendors = asyncHandler(async (req, res) => {
  let { size, page, searchKey, ...filterQuery } = req.query;
  const { skip, limit } = paginate(page, size);

  const mongooseQuery = vendorModel.find(filterQuery).populate({
    path: "ownerId",
    select: "userName email phone gender",
  });
  mongooseQuery.skip(skip).limit(limit);

  if (req.query.fields) {
    const fields = req.query.fields.replace(/,/g, " ");
    mongooseQuery.select(fields);
  }

  if (req.query.sort) {
    const sort = req.query.sort.replace(/,/g, " ");
    mongooseQuery.sort(sort);
  }

  const vendors = await mongooseQuery;
  const vendorsCount = await vendorModel.countDocuments(filterQuery);

  return res.status(200).json({ vendors, limit, page, vendorsCount });
});

export const addVendor = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const existingVendor = await vendorModel.findOne({ ownerId: userId });
  if (existingVendor) {
    return next(
      new Error("You're already a vendor.", {
        cause: 400,
      })
    );
  }

  const newVendor = await vendorModel.create({ ...req.body, ownerId: userId });

  const updatedUser = await userModel.findByIdAndUpdate(
    userId,
    { role: "Vendor" },
    { new: true }
  );

  return res.status(201).json({
    success: true,
    message: "Congratulations! You've become a partner.",
    vendor: newVendor,
    Owner: updatedUser,
  });
});

export const updateVendor = asyncHandler(async (req, res, next) => {
  const { vendorId } = req.params;
  const userId = req.user._id;

  const updatedVendor = await vendorModel.findByIdAndUpdate(
    vendorId,
    req.body,
    { new: true }
  );

  if (!updatedVendor) {
    return next(
      new Error("Vendor not found.", {
        cause: 404,
      })
    );
  }

  if (!updatedVendor.ownerId.equals(userId)) {
    return next(
      new Error("You are not authorized to update this vendor.", {
        cause: 403,
      })
    );
  }

  return res.status(200).json({
    success: true,
    message: "Vendor updated successfully.",
    vendor: updatedVendor,
  });
});

export const deleteVendor = asyncHandler(async (req, res, next) => {
  const { vendorId } = req.params;
  const userId = req.user._id;

  const deletedVendor = await vendorModel.findByIdAndDelete(vendorId);

  if (!deletedVendor) {
    return next(
      new Error("Vendor not found.", {
        cause: 404,
      })
    );
  }

  if (!deletedVendor.ownerId.equals(userId)) {
    return next(
      new Error("You are not authorized to delete this vendor.", {
        cause: 403,
      })
    );
  }

  return res.status(200).json({
    success: true,
    message: "Vendor deleted successfully.",
    vendor: deletedVendor,
  });
});
