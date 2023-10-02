import cloudinary from "../../../utils/cloudinary.js";
import couponModel from "../../../../DB/model/Coupon.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const getCoupon = asyncHandler(async (req, res, next) => {
  const couponList = await couponModel.find();
  return res.status(200).json({ success: true, message: "done", couponList });
});

export const createCoupon = asyncHandler(async (req, res, next) => {
  req.body.code = req.body.code.toUpperCase();
  if (await couponModel.findOne({ code: req.body.code })) {
    return next(
      new Error(`Duplicated coupon code (${req.body.code})`, { cause: 409 })
    );
  }
  req.body.createdBy = req.user._id;
  const coupon = await couponModel.create(req.body);

  return res.status(201).json({ success: true, message: "done", coupon });
});

export const updateCoupon = asyncHandler(async (req, res, next) => {
  const { couponId } = req.params;
  const coupon = await couponModel.findById(couponId);
  if (!coupon) {
    return next(new Error(`In-valid coupon Id`, { cause: 400 }));
  }
  if (req.body.code) {
    req.body.code = req.body.code.toLowerCase();
    if (req.body.code == coupon.code) {
      return next(
        new Error(`Cannot update coupon with the same old code`, { cause: 400 })
      );
    }
    if (await couponModel.findOne({ code: req.body.code })) {
      return next(
        new Error(`Duplicated coupon code (${req.body.code})`, { cause: 409 })
      );
    }
  }

  req.body.updatedBy = req.user._id;
  const updatedCoupon = await couponModel.updateOne(
    { _id: couponId },
    req.body
  );
  return res
    .status(200)
    .json({ success: true, message: "done", updatedCoupon });
});
