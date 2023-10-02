import { auth, roles } from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./reviews.validation.js";
import * as reviewController from "./controller/review.js";
import { Router } from "express";

const router = Router({ mergeParams: true });
const { Admin, User, Employee } = roles;

router.post(
  "/:productId",
  auth(User),
  validation(validators.createReview),
  reviewController.createReview
);

router.patch(
  "/:reviewId",
  auth(Admin, Employee),
  validation(validators.updateReview),
  reviewController.updateReview
);

export default router;
