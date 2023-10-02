import * as couponController from "./controller/coupon.js";
import * as validators from "./coupon.validation.js";
import { validation } from "../../middleware/validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { Router } from "express";
import { auth, roles } from "../../middleware/auth.js";
const router = Router();

const { Admin } = roles;

router.get("/", couponController.getCoupon);

router.post(
  "/",
  auth(Admin),
  validation(validators.createCoupon),
  couponController.createCoupon
);

router.put(
  "/:couponId",
  auth(Admin),
  validation(validators.updateCoupon),
  couponController.updateCoupon
);

export default router;
