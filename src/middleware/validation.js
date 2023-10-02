import joi from "joi";
import { Types } from "mongoose";

const validateObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message("In-valid objectId");
};
export const generalFields = {
  email: joi.string().email().required(),
  password: joi
    .string()
    .pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/))
    .required(),
  cPassword: joi.string().required(),
  id: joi.string().custom(validateObjectId).required(),
  file: joi.object({
    size: joi.number().positive().required(),
    path: joi.string().required(),
    filename: joi.string().required(),
    destination: joi.string().required(),
    mimetype: joi.string().required(),
    encoding: joi.string().required(),
    originalname: joi.string().required(),
    fieldname: joi.string().required(),
  }),
  phone: joi
    .array()
    .items(
      joi
        .string()
        .pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/))
        .required()
    )
    .min(1)
    .max(3)
    .required(),
  gender: joi.string().valid("male", "female").required(),
  type: joi.string().valid("Company", "Personal").required(),
  specialization: joi.string().required(),
  address: joi.string().required(),
  premium: joi.boolean().required(),
  handMade: joi.boolean().required(),
  deliveryFee: joi.number().required(),
  premium: joi.boolean(),
  prepareDays: joi.number().required(),
};

export const validation = (schema, considerHeaders = false) => {
  return (req, res, next) => {
    let inputsData = { ...req.body, ...req.params, ...req.query };
    if (req.file || req.files) {
      inputsData.file = req.file || req.files;
    }
    if (req.headers.authorization && considerHeaders) {
      inputsData = { authorization: req.headers.authorization };
    }

    const validationResult = schema.validate(inputsData, { abortEarly: false });
    if (validationResult.error) {
      return res.json({
        message: "validationErr",
        validationErr: validationResult.error.details,
      });
    }
    return next();
  };
};
