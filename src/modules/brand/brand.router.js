import * as brandController from "./controller/brand.js";
import * as validators from "./brand.validation.js";
import { validation } from "../../middleware/validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { Router } from "express";
import { auth, roles } from "../../middleware/auth.js";
const router = Router();

const { Admin } = roles;

router.get("/", brandController.getBrand);

router.post(
  "/",
  auth(Admin),
  fileUpload(fileValidation.image).single("image"),
  validation(validators.createBrand),
  brandController.createBrand
);

router.put(
  "/:brandId",
  auth(Admin),
  fileUpload(fileValidation.image).single("image"),
  validation(validators.updateBrand),
  brandController.updateBrand
);

router.delete(
  "/:brandId",
  auth(Admin),
  validation(validators.updateBrand),
  brandController.deleteBrand
);

export default router;
