import reviewRouter from '../reviews/reviews.router.js'
import * as productController from './controller/product.js'
import * as validators from './product.validation.js'
import { fileUpload, fileValidation } from '../../utils/multer.js'
import { validation } from '../../middleware/validation.js'
import { endpoint } from './product.endPoint.js';
import { auth, roles } from '../../middleware/auth.js'
import { Router } from "express";
const router = Router()


router.use("/:productId/review", reviewRouter)

router.get("/", productController.products)

router.post("/",
    auth(endpoint.create),
    fileUpload(fileValidation.image).fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'subImages', maxCount: 5 },

    ]),
    validation(validators.createProduct),
    productController.createProduct)


router.put("/:productId",
    auth(endpoint.update),
    fileUpload(fileValidation.image).fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'subImages', maxCount: 5 },

    ]),
    validation(validators.updateProduct),
    productController.updateProduct)


// Wishlist


router.patch("/:productId/wishlist/add",
    auth(endpoint.wishlist),
    productController.wishlist)

router.patch("/:productId/wishlist/remove",
    auth(endpoint.wishlist),
    productController.deleteFromWishlist)



export default router