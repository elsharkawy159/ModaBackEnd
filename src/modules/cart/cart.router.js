import * as cartController from "./controller/cart.js";
import * as validators from "./cart.validation.js";
import { validation } from "../../middleware/validation.js";
import { auth, roles } from "../../middleware/auth.js";
import { Router } from "express";
const router = Router();

const { User } = roles;

router.get("/", auth(User), cartController.getUserCart);

router.post(
  "/",
  auth(User),
  validation(validators.addToCart),
  cartController.addToCart
);

router.patch(
  "/remove",
  auth(User),
  validation(validators.deleteFromCart),
  cartController.deleteFromCart
);

router.patch("/clear", auth(User), cartController.clearCart);

export default router;
