import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

export const vendorData = joi
  .object({
    type: generalFields.type,
    specialization: generalFields.specialization,
    vendorAddress: generalFields.address,
    handMade: generalFields.handMade,
    premium: generalFields.premium,
    prepareDays: generalFields.prepareDays,
    deliveryFee: generalFields.deliveryFee,
  })
  .required();

export const deleteVendor = joi
  .object({
    vendorId: generalFields.id,
  })
  .required();
