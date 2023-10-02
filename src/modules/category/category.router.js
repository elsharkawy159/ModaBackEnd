import subcategoryRouter from "../subcategory/subcategory.router.js";
import * as categoryController from "./controller/category.js";
import * as validators from "./category.validation.js";
import { validation } from "../../middleware/validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { Router } from "express";
import { auth, roles } from "../../middleware/auth.js";
const router = Router();

const { Admin } = roles;

router.use("/:categoryId/subcategory", subcategoryRouter);
router.get("/", categoryController.getCategories);

router.post(
  "/",
  validation(validators.headers, true),
  auth(Admin),
  fileUpload(fileValidation.image).single("image"),
  validation(validators.createCategory),
  categoryController.createCategory
);

router.put(
  "/:categoryId",
  validation(validators.headers, true),
  auth(Admin),
  fileUpload(fileValidation.image).single("image"),
  validation(validators.updateCategory),
  categoryController.updateCategory
);

export default router;
