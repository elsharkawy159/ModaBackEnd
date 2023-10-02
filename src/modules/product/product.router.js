import reviewRouter from "../reviews/reviews.router.js";
import * as productController from "./controller/product.js";
import * as validators from "./product.validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { validation } from "../../middleware/validation.js";
import { auth, roles } from "../../middleware/auth.js";
import { Router } from "express";
const router = Router();

const { Admin, User, Vendor } = roles;

router.use("/:productId/review", reviewRouter);

router.get("/", productController.products);
router.get("/:productSlug", productController.productDetails);

router.post(
  "/",
  auth([Admin, Vendor]),
  fileUpload(fileValidation.image).fields([
    { name: "mainImage", maxCount: 1 },
    { name: "subImages", maxCount: 5 },
  ]),
  validation(validators.product),
  productController.createProduct
);

router.put(
  "/:productId",
  auth([Admin, Vendor]),
  fileUpload(fileValidation.image).fields([
    { name: "mainImage", maxCount: 1 },
    { name: "subImages", maxCount: 5 },
  ]),
  validation(validators.product),
  productController.updateProduct
);

// Wishlist

router.patch(
  "/:productId/wishlist/add",
  auth(User),
  productController.wishlist
);

router.patch(
  "/:productId/wishlist/remove",
  auth(User),
  productController.deleteFromWishlist
);

export default router;
