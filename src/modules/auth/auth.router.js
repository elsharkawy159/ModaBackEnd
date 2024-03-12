import * as authController from "./controller/registration.js";
import * as validators from "./auth.validation.js";
import { validation } from "../../middleware/validation.js";
import { Router } from "express";
import { auth, roles } from "../../middleware/auth.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
const router = Router();

const { Admin, User, Employee, Vendor } = roles;

router.post("/", auth([Admin]), authController.getUsers);

router.post("/signup", validation(validators.signup), authController.signup);

router.put(
  "/update",
  validation(validators.updateUser),
  auth([Admin, User, Employee, Vendor]),
  fileUpload(fileValidation.image).single("profile"),
  authController.updateUser
);

router.get(
  "/confirmEmail/:token",
  validation(validators.token),
  authController.confirmEmail
);

router.get(
  "/NewConfirmEmail/:token",
  validation(validators.token),
  authController.RequestNewConfirmEmail
);

router.post("/signin", validation(validators.signIn), authController.signIn);

router.patch(
  "/sendCode",
  validation(validators.sendCode),
  authController.sendCode
);

router.patch(
  "/forgetPassword",
  validation(validators.forgetPassword),
  authController.forgetPassword
);

export default router;
