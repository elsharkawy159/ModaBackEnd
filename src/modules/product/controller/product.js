
import subcategoryModel from '../../../../DB/model/Subcategory.model.js'
import brandModel from '../../../../DB/model/Brand.model.js'
import productModel from '../../../../DB/model/Product.mode.js'

import slugify from 'slugify';
import cloudinary from '../../../utils/cloudinary.js'
import { asyncHandler } from '../../../utils/errorHandling.js'
import { nanoid } from 'nanoid';
import userModel from '../../../../DB/model/User.model.js';
import { paginate } from '../../../utils/paginate.js';
import ApiFeatures from '../../../utils/apiFeatures.js';


export const products = asyncHandler(async (req, res, next) => {


    const apiFeature = new ApiFeatures(productModel.find().populate([{path:"review"}]), req.query).paginate().filter().search().select()
    const productList = await apiFeature.mongooseQuery
    for (let i = 0; i < productList.length; i++) {
        let calcRating = 0;
        for (let j = 0; j < productList[i].review.length; j++) {
            calcRating += productList[i].review[j].rating
        }
        const convObject = productList[i].toObject()
        convObject.rating = calcRating / productList[i].review.length
        productList[i] = convObject

    }
    return res.status(200).json({ message: "Done", productList })




   
})
//500 -50& => 500*25/100 == 500 - 125 = 375
export const createProduct = asyncHandler(async (req, res, next) => {
  
    const { name, price, discount, categoryId, subcategoryId, brandId } = req.body;
    //check  ids
    if (!await subcategoryModel.findOne({ _id: subcategoryId, categoryId })) {
        return next(new Error("In-valid category or subcategory ids", { cause: 400 }))
    }
    if (!await brandModel.findById(brandId)) {
        return next(new Error("In-valid category or subcategory ids", { cause: 400 }))
    }

    //create slug
    req.body.slug = slugify(name, {
        replacement: '-',
        trim: true,
        lower: true
    })

    //calc final  price
    req.body.finalPrice = price - (price * ((discount || 0) / 100))   // (100-discount)/100 * price
    req.body.customId = nanoid()
    // handel image 
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.files?.mainImage[0].path, { folder: `${process.env.APP_NAME}/product/${req.body.customId}` })
    req.body.mainImage = { secure_url, public_id }

    if (req.files?.subImages?.length) {
        req.body.subImages = []
        for (const file of req.files.subImages) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: `${process.env.APP_NAME}/product/${req.body.customId}/subImages` })
            req.body.subImages.push({ secure_url, public_id })
        }
    }
    req.body.createdBy = req.user._id
    const product = await productModel.create(req.body);
    return res.status(201).json({ message: "Done", product })
})


export const updateProduct = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const product = await productModel.findById(productId)
    if (!product) {
        return next(new Error("In-valid product id", { cause: 404 }))
    }

    const { name, price, discount, categoryId, subcategoryId, brandId } = req.body;
    //check  ids
    if (categoryId && subcategoryId) {
        if (!await subcategoryModel.findOne({ _id: subcategoryId, categoryId })) {
            return next(new Error("In-valid category or subcategory ids", { cause: 400 }))
        }
    }
    if (brandId) {
        if (!await brandModel.findById(brandId)) {
            return next(new Error("In-valid category or subcategory ids", { cause: 400 }))
        }
    }


    if (name) {
        //create slug
        req.body.slug = slugify(name, {
            replacement: '-',
            trim: true,
            lower: true
        })
    }


    //calc final  price
    req.body.finalPrice = (price || discount) ? (price || product.price) - ((price || product.price) * ((discount || product.discount) / 100)) : product.finalPrice;
    // if (price && discount) {
    //     req.body.finalPrice = price - (price * (discount / 100))   // (100-discount)/100 * price
    // } else if (price) {
    //     req.body.finalPrice = price - (price * (product.discount / 100))   // (100-discount)/100 * price
    // } else if (discount) {
    //     req.body.finalPrice = product.price - (product.price * (discount / 100))   // (100-discount)/100 * price
    // }


    // handel image 
    if (req.files?.mainImage?.length) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.files?.mainImage[0].path, { folder: `${process.env.APP_NAME}/product/${product.customId}` })
        req.body.mainImage = { secure_url, public_id }
        await cloudinary.uploader.destroy(product.mainImage.public_id)

    }


    if (req.files?.subImages?.length) {
        req.body.subImages = []
        for (const file of req.files.subImages) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: `${process.env.APP_NAME}/product/${product.customId}/subImages` })
            req.body.subImages.push({ secure_url, public_id })
        }
        // if (product.subImages?.length) {
        //   cloudinary.api.delete_All_resources([''])
        // }
    }
    req.body.updatedBy = req.user._id
    await productModel.updateOne({ _id: productId }, req.body)
    return res.status(200).json({ message: "Done" })
})

export const wishlist = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    if (!await productModel.findOne({ _id: productId, isDeleted: false })) {
        return next(new Error('In-valid product', { cause: 404 }))
    }
    await userModel.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } })

    return res.status(200).json({ message: "Done" })
})

export const deleteFromWishlist = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    await userModel.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } })
    return res.status(200).json({ message: "Done" })
})