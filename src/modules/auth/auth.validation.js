import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

export const signup = joi
  .object({
    userName: joi.string().min(2).max(20).required(),
    email: generalFields.email,
    password: generalFields.password,
    cPassword: generalFields.cPassword,
    phone: generalFields.phone,
    gender: generalFields.gender,
  })
  .required();

export const signIn = joi
  .object({
    email: generalFields.email,
    password: generalFields.password,
  })
  .required();

export const updateUser = joi
  .object({
    userName: joi.string().min(2).max(20).required(),
    phone: generalFields.phone,
    gender: generalFields.gender,
    address: joi.string(),
    profile: joi.object({
      size: joi.number().positive(),
      path: joi.string(),
      filename: joi.string(),
      destination: joi.string(),
      mimetype: joi.string(),
      encoding: joi.string(),
      originalname: joi.string(),
      fieldname: joi.string(),
    }),
    DOB: joi.date(),
  })
  .required();

export const token = joi
  .object({
    Authorization: joi.string().required(),
  })
  .required();

export const sendCode = joi
  .object({
    email: generalFields.email,
  })
  .required();

export const forgetPassword = joi
  .object({
    email: generalFields.email,
    password: generalFields.password,
    code: joi
      .string()
      .pattern(new RegExp(/^\d{4}$/))
      .required(),
  })
  .required();
