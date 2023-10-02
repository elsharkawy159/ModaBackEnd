import * as subcategoryController from "./controller/subcategory.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { Router } from "express";
import { auth, roles } from "../../middleware/auth.js";
const router = Router({ mergeParams: true });
const { Admin } = roles;

router.get("/", subcategoryController.getSubcategories);

router.post(
  "/:categoryId",
  auth(Admin),
  fileUpload(fileValidation.image).single("image"),
  subcategoryController.createSubcategory
);

router.put(
  "/:subcategoryId",
  auth(Admin),
  fileUpload(fileValidation.image).single("image"),
  subcategoryController.updateSubcategory
);

export default router;
