import * as vendorController from "./controller/vendor.js";
import * as validators from "./vendor.validation.js";
import { validation } from "../../middleware/validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { Router } from "express";
import { auth, roles } from "../../middleware/auth.js";
const router = Router();

const { Admin, User, Employee, Vendor } = roles;

router.get("/", vendorController.getVendors);

router.post(
  "/",
  validation(validators.vendorData),
  auth([User, Employee]),
  vendorController.addVendor
);

router.put(
  "/:vendorId",
  auth([Admin, Vendor]),
  validation(validators.vendorData),
  vendorController.updateVendor
);

router.delete(
  "/:vendorId",
  auth([Admin, Vendor]),
  validation(validators.deleteVendor),
  vendorController.deleteVendor
);

export default router;
