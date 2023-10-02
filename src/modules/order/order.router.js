import { auth, roles } from "../../middleware/auth.js";
import * as orderController from "./controller/order.js";
import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as validators from "./order.validation.js";
import express from "express";
const router = Router();

const { Admin, User, Employee, Vendor } = roles;

router.get("/", auth(Admin,Employee), orderController.getAllOrders);

router.post(
  "/",
  auth(User),
  validation(validators.createOrder),
  orderController.createOrder
);

router.patch(
  "/:orderId/cancel",
  auth([Admin, User]),
  validation(validators.cancel),
  orderController.cancelOrder
);

router.patch(
  "/:orderId/status",
  auth(Admin, Vendor, Employee),
  validation(validators.deliveredOrder),
  orderController.deliveredOrder
);

export default router;
