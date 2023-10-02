import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

export const createCoupon = joi
  .object({
    code: joi.string().min(2).max(25).required(),
    amount: joi.number().positive().min(1).max(250).required(),
    minOrderAmount: joi.number().positive().min(1),
    firstOrder: joi.boolean().required(),
    expire: joi.date().required().greater(Date.now()),
})
.required();

export const updateCoupon = joi
.object({
    couponId: generalFields.id,
    code: joi.string().min(2).max(25),
    amount: joi.number().positive().min(1).max(250),
    minOrderAmount: joi.number().positive().min(1),
    firstOrder: joi.boolean().required(),
    expire: joi.date().greater(Date.now()),
  })
  .required();
