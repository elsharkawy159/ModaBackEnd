import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

const transformArray = (value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error("Invalid JSON string");
    }
  }
  return value;
};

export const product = joi
  .object({
    name: joi.string().min(2).max(100).required(),
    description: joi.string().min(2).max(15000),
    size: joi.string().custom(transformArray),
    colors: joi.string().custom(transformArray),
    attributes: joi.string().custom(transformArray),
    top: joi.boolean(),
    new: joi.boolean(),
    handMade: joi.boolean(),
    stock: joi.number().positive().integer().min(1).required(),
    price: joi.number().positive().min(1).required(),
    discount: joi.number().positive().min(1),
    pepareDays: joi.number().positive(),
    categoryId: generalFields.id,
    subcategoryId: generalFields.id,
    brandId: generalFields.id,
    file: joi
      .object({
        mainImage: joi
          .array()
          .items(generalFields.file.required())
          .length(1)
          .required(),
        subImages: joi.array().items(generalFields.file).min(1).max(5),
      })
      .required(),
  })
  .required();
