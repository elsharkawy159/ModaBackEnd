
import * as couponController from './controller/coupon.js'
import * as validators from './coupon.validation.js'
import { validation } from '../../middleware/validation.js';
import { fileUpload, fileValidation } from '../../utils/multer.js'
import { Router } from "express";
import { auth } from '../../middleware/auth.js';
import { endpoint } from './coupon.endPoint.js';
const router = Router()


router.get('/',
    couponController.getCoupon)


router.post('/',
    auth(endpoint.create),
    fileUpload(fileValidation.image).single('image'),
    validation(validators.createCoupon),
    couponController.createCoupon)

router.put('/:couponId',
    auth(endpoint.update),
    fileUpload(fileValidation.image).single('image'),
    validation(validators.updateCoupon),
    couponController.updateCoupon)



export default router