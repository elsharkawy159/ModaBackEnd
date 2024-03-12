import * as cartController from "./controller/cart.js";
import * as validators from "./cart.validation.js";
import { validation } from "../../middleware/validation.js";
import { auth, roles } from "../../middleware/auth.js";
import { Router } from "express";
const router = Router();

const { Admin, User, Vendor } = roles;

router.get("/", auth(User), cartController.getUserCart);

router.post(
  "/",
  auth([Admin, Vendor, User]),
  validation(validators.addToCart),
  cartController.addToCart
);

router.patch(
  "/remove",
  auth([Admin, Vendor, User]),
  validation(validators.deleteFromCart),
  cartController.deleteFromCart
);

router.patch("/clear", auth([Admin, Vendor, User]), cartController.clearCart);

export default router;
